<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WP_Synapse_File_Manager {

	private $backup_dir = '';

	public function __construct() {
		$upload_dir = wp_upload_dir();
		$this->backup_dir = $upload_dir['basedir'] . '/wp-synapse-backups';
		if ( ! file_exists( $this->backup_dir ) ) {
			wp_mkdir_p( $this->backup_dir );
		}
	}

    private function detect_redis() {
        // Check if PHPRedis or Predis is active
        if ( class_exists( 'Redis' ) ) {
            return 'php-redis';
        }
        if ( class_exists( 'Predis\Client' ) ) {
            return 'predis';
        }
        return false;
    }

    private function get_redis_client() {
        $type = $this->detect_redis();
        if ( ! $type ) return null;

        try {
            if ( $type === 'php-redis' ) {
                $redis = new \Redis();
                // Standard default connection. In real scenarios, these would be filtered.
                $host = defined('REDIS_HOST') ? REDIS_HOST : '127.0.0.1';
                $port = defined('REDIS_PORT') ? REDIS_PORT : 6379;
                @$redis->connect($host, $port);
                return $redis;
            }
        } catch ( \Exception $e ) {
            return null;
        }
        return null;
    }

    public function get_full_path($relative_path) {
        $security = \WP_Synapse_Security::get_instance();
        return $security->sanitize_path($relative_path);
    }

	public function update_file( $relative_path, $new_content, $action = 'overwrite', $original_content = '' ) {
		$security = \WP_Synapse_Security::get_instance();
		$full_path = $security->sanitize_path( $relative_path );

		if ( ! $full_path ) {
			return [ 'path' => $relative_path, 'status' => 'error', 'message' => 'Invalid path' ];
		}

		$dir = dirname( $full_path );
        if ( ! file_exists( $dir ) ) {
            wp_mkdir_p( $dir );
        }

		$is_file_writable = is_writable( $full_path );
		$is_dir_writable  = is_writable( $dir );

		if ( file_exists( $full_path ) && ! $is_file_writable && ! $is_dir_writable ) {
			return [ 'path' => $relative_path, 'status' => 'error', 'message' => 'File not writable and directory locked.' ];
		}

		// Create Backup
		$backup_res = $this->create_backup( $full_path, $relative_path );
		if ( $backup_res['status'] === 'error' ) {
			return $backup_res;
		}

		// Force-unlink if file is read-only but directory is writable
		if ( file_exists( $full_path ) && ! $is_file_writable && $is_dir_writable && $action !== 'append' && $action !== 'replace' ) {
			@unlink( $full_path );
		}

        $final_content = '';
        $replacement_log = [];

        if ( $action === 'append' && file_exists( $full_path ) ) {
            $existing_content = file_get_contents( $full_path );
            if ( false === $existing_content ) {
                return [ 'path' => $relative_path, 'status' => 'error', 'message' => 'Failed to read existing file for appending.' ];
            }

            // 1. Intelligent PHP Tag Handling
            $has_php_tag = ( strpos( $existing_content, '<?php' ) !== false );
            $clean_new_content = preg_replace( '/^<\?php\s*|\s*\?>$/i', '', trim( $new_content ) );
            
            if ( ! $has_php_tag && strpos( $full_path, '.php' ) !== false ) {
                $existing_content = "<?php\n\n" . ltrim($existing_content);
                $has_php_tag = true;
            }

            $current_snippet = $clean_new_content;

            // 2. INTELLIGENT REPLACEMENT: Functions
            if ( preg_match_all( '/function\s+([a-zA-Z0-9_]+)\s*\(/i', $clean_new_content, $func_matches, PREG_SET_ORDER ) ) {
                foreach ( $func_matches as $match ) {
                    $func_name = $match[1];
                    if ( preg_match( '/function\s+' . preg_quote($func_name, '/') . '\s*\(/i', $existing_content, $e_matches, PREG_OFFSET_CAPTURE ) ) {
                        $e_pos = $e_matches[0][1];
                        if ( preg_match( '/function\s+' . preg_quote($func_name, '/') . '\s*\(/i', $current_snippet, $n_matches, PREG_OFFSET_CAPTURE ) ) {
                            $n_pos = $n_matches[0][1];
                            $e_block = $this->extract_function_block( $existing_content, $e_pos );
                            $n_block = $this->extract_function_block( $current_snippet, $n_pos );

                            if ( $e_block && $n_block ) {
                                $e_wrapper = $this->extract_wrapper_block( $existing_content, $e_pos, $func_name );
                                $n_wrapper = $this->extract_wrapper_block( $current_snippet, $n_pos, $func_name );

                                $final_e = $e_wrapper ?: $e_block;
                                $final_n = $n_wrapper ?: $n_block;

                                // Replace only the first occurrence found to avoid corrupting similar looking code
                                $pos = strpos($existing_content, $final_e);
                                if ($pos !== false) {
                                    $existing_content = substr_replace($existing_content, $final_n, $pos, strlen($final_e));
                                    $current_snippet = str_replace($final_n, '', $current_snippet);
                                    $replacement_log[] = "Updated function '{$func_name}'";
                                }
                            }
                        }
                    }
                }
            }

            // 3. INTELLIGENT REPLACEMENT: Shortcodes
            if ( preg_match_all( '/add_shortcode\s*\(\s*([\'"])(.*?)\1/i', $clean_new_content, $sc_matches, PREG_SET_ORDER ) ) {
                foreach ( $sc_matches as $match ) {
                    $sc_tag = $match[2];
                    if ( preg_match( '/add_shortcode\s*\(\s*([\'"])' . preg_quote($sc_tag, '/') . '\1/i', $existing_content, $e_matches, PREG_OFFSET_CAPTURE ) ) {
                        $e_pos = $e_matches[0][1];
                        if ( preg_match( '/add_shortcode\s*\(\s*([\'"])' . preg_quote($sc_tag, '/') . '\1/i', $current_snippet, $n_matches, PREG_OFFSET_CAPTURE ) ) {
                            $n_pos = $n_matches[0][1];
                            $e_end = strpos( $existing_content, ';', $e_pos );
                            $n_end = strpos( $current_snippet, ';', $n_pos );

                            if ( $e_end !== false && $n_end !== false ) {
                                $e_line = substr( $existing_content, $e_pos, $e_end - $e_pos + 1 );
                                $n_line = substr( $current_snippet, $n_pos, $n_end - $n_pos + 1 );
                                $existing_content = str_replace( $e_line, $n_line, $existing_content );
                                $current_snippet = str_replace( $n_line, '', $current_snippet );
                                $replacement_log[] = "Updated shortcode '{$sc_tag}'";
                            }
                        }
                    }
                }
            }

            // 4. INTELLIGENT REPLACEMENT: Hooks (Actions/Filters)
            if ( preg_match_all( '/add_(action|filter)\s*\(\s*([\'"])(.*?)\2\s*,\s*([\'"]|array\(|\[)(.*?)([\'"]|\)|\])/i', $clean_new_content, $hook_matches, PREG_SET_ORDER ) ) {
                foreach ( $hook_matches as $match ) {
                    $type = $match[1];
                    $hook = $match[3];
                    $callback = $match[5];
                    $pattern = '/add_' . $type . '\s*\(\s*([\'"])' . preg_quote($hook, '/') . '\1\s*,\s*([\'"]|array\(|\[)' . preg_quote($callback, '/') . '/i';
                    
                    if ( preg_match( $pattern, $existing_content, $e_matches, PREG_OFFSET_CAPTURE ) ) {
                        $e_pos = $e_matches[0][1];
                        if ( preg_match( $pattern, $current_snippet, $n_matches, PREG_OFFSET_CAPTURE ) ) {
                            $n_pos = $n_matches[0][1];
                            $e_end = strpos( $existing_content, ';', $e_pos );
                            $n_end = strpos( $current_snippet, ';', $n_pos );

                            if ( $e_end !== false && $n_end !== false ) {
                                $e_line = substr( $existing_content, $e_pos, $e_end - $e_pos + 1 );
                                $n_line = substr( $current_snippet, $n_pos, $n_end - $n_pos + 1 );
                                $existing_content = str_replace( $e_line, $n_line, $existing_content );
                                $current_snippet = str_replace( $n_line, '', $current_snippet );
                                $replacement_log[] = "Updated {$type} on '{$hook}'";
                            }
                        }
                    }
                }
            }

            // Final check: Did we update anything or have leftovers to append?
            $current_snippet = trim($current_snippet);
            if ( ! empty( $current_snippet ) ) {
                // Strip trailing PHP close tag from existing file if present, to safely append code
                $existing_content = preg_replace( '/\?>\s*$/', '', $existing_content );
                
                $marker = "// Synapse AI Appended Code";
                if ( strpos( $existing_content, $marker ) !== false ) {
                    $final_content = rtrim($existing_content) . "\n\n" . $current_snippet . "\n";
                } else {
                    $final_content = rtrim($existing_content) . "\n\n" . $marker . "\n" . $current_snippet . "\n";
                }
            } else {
                $final_content = $existing_content;
            }
        } elseif ( $action === 'replace' && file_exists( $full_path ) ) {
            $existing_content = file_get_contents( $full_path );
            if ( false === $existing_content ) {
                return [ 'path' => $relative_path, 'status' => 'error', 'message' => 'Failed to read existing file for replacing.' ];
            }

            if ( empty( $original_content ) ) {
                return [ 'path' => $relative_path, 'status' => 'error', 'message' => 'Replacement failed: Original content to match was not provided.' ];
            }

            if ( strpos( $existing_content, $original_content ) === false ) {
                return [ 'path' => $relative_path, 'status' => 'error', 'message' => 'Replacement failed: Could not find the original code block in the file.' ];
            }

            $final_content = str_replace( $original_content, $new_content, $existing_content );
        } else {
            // Default to overwrite or creating new file
            $final_content = $new_content;
        }

		// Final Write Content
		if ( false === file_put_contents( $full_path, $final_content ) ) {
			return [ 'path' => $relative_path, 'status' => 'error', 'message' => 'Failed to write file.' ];
		}

        // Clear code index cache
        delete_transient( 'synapse_code_index' );

		return [ 
            'path' => $relative_path, 
            'status' => 'success', 
            'backup' => $backup_res['backup_path'],
            'message' => empty($replacement_log) ? 'File updated successfully.' : implode(', ', $replacement_log),
            'final_content' => $final_content 
        ];
	}

	private function create_backup( $full_path, $relative_path ) {
        $key = 'synapse_revert_' . md5( $relative_path );
        $history = get_transient( $key ) ?: [];
        if ( ! is_array( $history ) ) $history = [ $history ]; // Migration for old single-version backups

		if ( ! file_exists( $full_path ) ) {
            if ( empty($history) ) {
                $history[] = '<NEW_FILE_DELETED>';
                set_transient( $key, $history, 24 * HOUR_IN_SECONDS );
            }
			return [ 'status' => 'success', 'backup_path' => 'new-file' ];
		}

        $original_content = file_get_contents( $full_path );
        
        // Only add to history if the content is different from the last version
        if ( empty($history) || end($history) !== $original_content ) {
            $history[] = $original_content;
            // Keep only last 10 versions
            if ( count($history) > 10 ) array_shift($history);
            set_transient( $key, $history, 24 * HOUR_IN_SECONDS );
        }

		$filename = basename( $full_path );
		$timestamp = time();
		$backup_filename = $filename . '.' . $timestamp . '.bak';
		$backup_path = $this->backup_dir . '/' . $backup_filename;

		@copy( $full_path, $backup_path );
        
		return [ 'status' => 'success', 'backup_path' => $backup_path ];
	}

    public function revert_file( $relative_path ) {
		$security = \WP_Synapse_Security::get_instance();
		$full_path = $security->sanitize_path( $relative_path );

		if ( ! $full_path ) {
			return [ 'status' => 'error', 'message' => 'Invalid path' ];
		}

        $key = 'synapse_revert_' . md5( $relative_path );
        $history = get_transient( $key );

        if ( empty( $history ) || ! is_array( $history ) ) {
            return [ 'status' => 'error', 'message' => 'No cached version found to revert to.' ];
        }

        $cached_content = array_pop( $history );
        
        // Save the reduced history back
        if ( empty($history) ) {
            delete_transient( $key );
        } else {
            set_transient( $key, $history, 24 * HOUR_IN_SECONDS );
        }

        if ( $cached_content === '<NEW_FILE_DELETED>' ) {
            if ( file_exists( $full_path ) ) {
                @unlink( $full_path );
            }
            return [ 'status' => 'success', 'message' => 'New file was safely removed via revert.', 'final_content' => '' ];
        }

		if ( false === file_put_contents( $full_path, $cached_content ) ) {
			return [ 'status' => 'error', 'message' => 'Failed to write reverted file.' ];
		}

		return [ 
            'status' => 'success', 
            'message' => 'File reverted successfully. Remaining undo steps: ' . count($history),
            'final_content' => $cached_content 
        ];
    }

    private function extract_function_block( $content, $start_pos ) {
        // Find the first { after the start_pos
        $first_brace = strpos( $content, '{', $start_pos );
        if ( $first_brace === false ) return null;

        $length = strlen( $content );
        $brace_count = 0;
        $current_pos = $first_brace;
        $in_string = false;
        $string_char = '';
        $in_comment = false;
        $comment_type = ''; // 'line' or 'block'

        while ( $current_pos < $length ) {
            $char = $content[$current_pos];
            $next_char = ($current_pos + 1 < $length) ? $content[$current_pos + 1] : '';

            // Handle Strings
            if ( ! $in_comment ) {
                if ( ! $in_string ) {
                    if ( $char === "'" || $char === '"' ) {
                        $in_string = true;
                        $string_char = $char;
                    }
                } else {
                    // Check for escaped quote
                    if ( $char === $string_char && $content[$current_pos - 1] !== '\\' ) {
                        $in_string = false;
                    }
                }
            }

            // Handle Comments
            if ( ! $in_string ) {
                if ( ! $in_comment ) {
                    if ( $char === '/' && $next_char === '/' ) {
                        $in_comment = true;
                        $comment_type = 'line';
                    } elseif ( $char === '/' && $next_char === '*' ) {
                        $in_comment = true;
                        $comment_type = 'block';
                    }
                } else {
                    if ( $comment_type === 'line' && $char === "\n" ) {
                        $in_comment = false;
                    } elseif ( $comment_type === 'block' && $char === '*' && $next_char === '/' ) {
                        $in_comment = false;
                        $current_pos++; // Skip the / in */
                    }
                }
            }

            // Handle Braces
            if ( ! $in_string && ! $in_comment ) {
                if ( $char === '{' ) {
                    $brace_count++;
                } elseif ( $char === '}' ) {
                    $brace_count--;
                    if ( $brace_count === 0 ) {
                        // Include everything from the original start_pos to this closing brace
                        return substr( $content, $start_pos, $current_pos - $start_pos + 1 );
                    }
                }
            }

            $current_pos++;
            
            // Safety: Don't extract more than 5000 characters for a single block
            if ( $current_pos - $start_pos > 5000 ) break;
        }

        return null;
    }

    private function extract_wrapper_block( $content, $item_pos, $item_name ) {
        // Search backwards for if(!function_exists('item_name'))
        $search_limit = max(0, $item_pos - 150);
        $before = substr( $content, $search_limit, $item_pos - $search_limit );
        
        $pattern = '/if\s*\(\s*!function_exists\s*\(\s*[\'"]' . preg_quote($item_name, '/') . '[\'"]\s*\)\s*\)\s*\{/i';
        if ( preg_match( $pattern, $before, $matches, PREG_OFFSET_CAPTURE ) ) {
            $start_pos = $search_limit + $matches[0][1];
            // Now use brace counting from this start_pos
            $full_block = $this->extract_function_block( $content, $start_pos );
            if ( $full_block ) {
                return $full_block;
            }
        }
        return null;
    }

    public function create_file( $relative_path, $content = '' ) {
        $security = \WP_Synapse_Security::get_instance();
        $full_path = $security->sanitize_path( $relative_path );

        if ( ! $full_path ) {
            return [ 'status' => 'error', 'message' => 'Invalid path' ];
        }

        if ( file_exists( $full_path ) ) {
            return [ 'status' => 'error', 'message' => 'File already exists' ];
        }

        $dir = dirname( $full_path );
        if ( ! file_exists( $dir ) ) {
            wp_mkdir_p( $dir );
        }

        if ( false === file_put_contents( $full_path, $content ) ) {
            return [ 'status' => 'error', 'message' => 'Failed to create file' ];
        }

        // Clear code index cache
        delete_transient( 'synapse_code_index' );

        return [ 'status' => 'success', 'message' => 'File created successfully', 'path' => $relative_path ];
    }

    public function create_folder( $relative_path ) {
        $security = \WP_Synapse_Security::get_instance();
        $full_path = $security->sanitize_path( $relative_path );

        if ( ! $full_path ) {
            return [ 'status' => 'error', 'message' => 'Invalid path' ];
        }

        if ( file_exists( $full_path ) ) {
            return [ 'status' => 'error', 'message' => 'Folder already exists' ];
        }

        if ( ! wp_mkdir_p( $full_path ) ) {
            return [ 'status' => 'error', 'message' => 'Failed to create folder' ];
        }

        return [ 'status' => 'success', 'message' => 'Folder created successfully', 'path' => $relative_path ];
    }

    public function delete_item( $relative_path ) {
        $security = \WP_Synapse_Security::get_instance();
        $full_path = $security->sanitize_path( $relative_path );

        if ( ! $full_path || ! file_exists( $full_path ) ) {
            return [ 'status' => 'error', 'message' => 'Item not found or invalid path' ];
        }

        // Prevent deleting WP core or sensitive directories
        $root = str_replace( '\\', '/', ABSPATH );
        if ( $full_path === $root || $full_path === $root . 'wp-admin' || $full_path === $root . 'wp-includes' || $full_path === $root . 'wp-content' ) {
            return [ 'status' => 'error', 'message' => 'Cannot delete system-protected directories.' ];
        }

        if ( is_dir( $full_path ) ) {
            $result = $this->recursive_delete( $full_path );
        } else {
            $result = @unlink( $full_path );
        }

        if ( ! $result ) {
            return [ 'status' => 'error', 'message' => 'Failed to delete item. Check permissions.' ];
        }

        // Clear code index cache
        delete_transient( 'synapse_code_index' );

        return [ 'status' => 'success', 'message' => 'Item deleted successfully' ];
    }

    private function recursive_delete( $dir ) {
        if ( ! is_dir( $dir ) ) return false;
        $files = array_diff( scandir( $dir ), [ '.', '..' ] );
        foreach ( $files as $file ) {
            $path = $dir . '/' . $file;
            ( is_dir( $path ) ) ? $this->recursive_delete( $path ) : @unlink( $path );
        }
        return @rmdir( $dir );
    }

    public function rename_item( $old_path, $new_name ) {
        $security = \WP_Synapse_Security::get_instance();
        $old_full_path = $security->sanitize_path( $old_path );
        
        if ( ! $old_full_path || ! file_exists( $old_full_path ) ) {
            return [ 'status' => 'error', 'message' => 'Original item not found' ];
        }

        $dir = dirname( $old_full_path );
        $new_full_path = $dir . DIRECTORY_SEPARATOR . $new_name;

        // Security check for the new path
        $root = str_replace( '\\', '/', ABSPATH );
        $normalized_new = str_replace( '\\', '/', $new_full_path );
        if ( strpos( $normalized_new, $root ) !== 0 ) {
            return [ 'status' => 'error', 'message' => 'Invalid new name' ];
        }

        if ( file_exists( $new_full_path ) ) {
            return [ 'status' => 'error', 'message' => 'An item with this name already exists' ];
        }

        if ( ! @rename( $old_full_path, $new_full_path ) ) {
            return [ 'status' => 'error', 'message' => 'Failed to rename item. Check permissions.' ];
        }

        // Clear code index cache
        delete_transient( 'synapse_code_index' );

        return [ 
            'status' => 'success', 
            'message' => 'Item renamed successfully', 
            'old_path' => $old_path,
            'new_path' => str_replace( $root, '', $normalized_new )
        ];
    }
}
