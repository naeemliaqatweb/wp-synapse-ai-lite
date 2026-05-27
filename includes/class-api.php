<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WP_Synapse_API {

	private static $instance = null;
    private $api_key = ''; // To be configured by developer

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	public function register_routes() {
		register_rest_route( 'wp-synapse-ai/v1', '/files', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_files' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/file-content', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'get_file_content' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );



		register_rest_route( 'wp-synapse-ai/v1', '/save-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'save_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/revert-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'revert_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );




        


		register_rest_route( 'wp-synapse-ai/v1', '/create-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'create_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/create-folder', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'create_folder' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/delete-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'delete_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/rename-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'rename_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/fix-permissions', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'fix_permissions' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );
		
		register_rest_route( 'wp-synapse-ai/v1', '/upload-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'upload_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/zip-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'zip_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/unzip-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'unzip_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );
		
		register_rest_route( 'wp-synapse-ai/v1', '/search-files', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'search_files' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/duplicate-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'duplicate_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/move-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'move_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/settings', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_settings' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/settings', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'save_settings' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/index-files', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'index_files' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai/v1', '/chat', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'ai_chat' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );
	}

    private function get_active_theme_hooks() {
        $functions_php_path = get_stylesheet_directory() . '/functions.php';
        if ( ! file_exists( $functions_php_path ) ) {
            return [];
        }
        $content = @file_get_contents( $functions_php_path );
        if ( empty( $content ) ) {
            return [];
        }
        $hooks = [];
        // Scan for add_action / add_filter calls
        if ( preg_match_all( '/add_(action|filter)\s*\(\s*[\'"]([^\'"]+)[\'"]\s*,\s*([^\)]+)\)/i', $content, $matches ) ) {
            foreach ( $matches[2] as $index => $hook_name ) {
                $type = strtolower( $matches[1][$index] );
                $callback = trim( $matches[3][$index] );
                $hooks[] = "- {$type} on '{$hook_name}' calling: {$callback}";
            }
        }
        return array_slice( array_unique( $hooks ), 0, 50 );
    }

    public function ai_chat( $request ) {
        $params = $request->get_json_params();
        $message = $params['message'] ?? '';
        $history = $params['history'] ?? [];
        $file_context = $params['file_context'] ?? null;
        $settings = \WP_Synapse_Core::get_instance()->get_settings();
        $model = !empty($params['model']) ? $params['model'] : (!empty($settings['ai_model']) ? $settings['ai_model'] : (defined('GEMINI_API_MODEL') ? GEMINI_API_MODEL : 'gemini-2.0-flash'));
        
        // Auto-fix common model naming issues
        if ($model === 'gemini-flash-latest' || $model === 'gemini-1.5-flash-latest') {
            $model = 'gemini-2.0-flash';
        }
        
        $api_key = !empty($settings['ai_api_key']) ? $settings['ai_api_key'] : (defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '');

        if ( empty( $api_key ) ) {
            return new WP_Error( 'missing_key', 'Please provide a Gemini API Key in Settings.', [ 'status' => 400 ] );
        }

        // Active theme hooks
        $theme_hooks = $this->get_active_theme_hooks();
        $hooks_str = ! empty( $theme_hooks ) ? implode( "\n", $theme_hooks ) : "No custom action/filter hooks detected in active theme's functions.php.";

        // Active theme/plugins
        $active_theme = wp_get_theme();
        $theme_name = $active_theme->get( 'Name' );
        $active_plugins = get_option( 'active_plugins', [] );
        $active_plugins_list = array_map( 'basename', $active_plugins );

        // Build System Prompt
        $system_prompt = "You are an expert WordPress AI coding assistant integrated into the Synapse Pro IDE.\n\n";
        $system_prompt .= "Site Environment Context:\n";
        $system_prompt .= "- Active Theme: {$theme_name}\n";
        $system_prompt .= "- Active Plugins: " . implode( ', ', $active_plugins_list ) . "\n\n";
        $system_prompt .= "Hooks detected in active theme's functions.php:\n{$hooks_str}\n\n";
        
        if ( $file_context ) {
            $system_prompt .= "The user is currently viewing/editing a file named '{$file_context['name']}' at path '{$file_context['path']}'.\n";
            $system_prompt .= "Current file content:\n```\n{$file_context['content']}\n```\n\n";
        }
        
        $system_prompt .= "Capabilities & Guidelines:\n";
        $system_prompt .= "1. You can fix bugs, refactor code, write unit tests, explain concepts, and add new features.\n";
        $system_prompt .= "2. You can generate starter file templates or write complete draft code for custom plugins/themes.\n";
        $system_prompt .= "3. Respond as a helpful assistant. If you suggest code changes, provide the full updated code clearly.\n";
        $system_prompt .= "4. IMPORTANT: If you suggest code to be applied, wrap it in [CODE_START] and [CODE_END] markers so the IDE can parse it and let the user click 'Apply' or 'Review'.\n";

        // Map Chat History to Gemini API format
        $contents = [];
        foreach ( $history as $msg ) {
            $role = ($msg['role'] === 'assistant' || $msg['role'] === 'model') ? 'model' : 'user';
            $content = $msg['content'] ?? '';
            if ( ! empty( $content ) ) {
                $contents[] = [
                    'role'  => $role,
                    'parts' => [
                        [ 'text' => $content ]
                    ]
                ];
            }
        }

        // Fallback if history is empty
        if ( empty( $contents ) ) {
            $contents[] = [
                'role'  => 'user',
                'parts' => [
                    [ 'text' => $message ]
                ]
            ];
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$api_key}";

        $body = [
            'contents' => $contents,
            'systemInstruction' => [
                'parts' => [
                    [ 'text' => $system_prompt ]
                ]
            ]
        ];

        $max_retries = 3;
        $attempt = 0;
        $response = null;
        $error_message = '';
        $status_code = 500;

        while ( $attempt < $max_retries ) {
            $attempt++;
            $response = wp_remote_post( $url, [
                'headers' => [ 'Content-Type' => 'application/json' ],
                'body'    => json_encode( $body ),
                'timeout' => 45
            ] );

            if ( ! is_wp_error( $response ) ) {
                $res_body = json_decode( wp_remote_retrieve_body( $response ), true );
                if ( ! isset( $res_body['error'] ) ) {
                    $error_message = ''; // Reset, we succeeded
                    break;
                } else {
                    $error_message = $res_body['error']['message'] ?? 'API Error';
                    $status_code = 400;
                }
            } else {
                $error_message = $response->get_error_message();
                $status_code = 500;
            }

            if ( $attempt < $max_retries ) {
                usleep( 500000 ); // Wait 0.5s before next attempt
            }
        }

        if ( ! empty( $error_message ) ) {
            return new WP_Error( 'api_error', $error_message . " (Failed after {$attempt} attempts)", [ 'status' => $status_code ] );
        }

        $res_body = json_decode( wp_remote_retrieve_body( $response ), true );

        $reply = $res_body['candidates'][0]['content']['parts'][0]['text'] ?? 'No response from AI.';

        // Extract suggested code if markers exist
        $suggested_code = null;
        if ( preg_match( '/\[CODE_START\](.*?)\[CODE_END\]/s', $reply, $matches ) ) {
            $suggested_code = trim( $matches[1] );
            $reply = str_replace( $matches[0], "\n(Suggested code ready to apply below)\n", $reply );
        }

        return new WP_REST_Response( [
            'status' => 'success',
            'reply'  => $reply,
            'suggested_code' => $suggested_code
        ], 200 );
    }

    public function index_files() {
        if ( ! \WP_Synapse_Core::get_instance()->is_feature_enabled( 'vector_search' ) ) {
            return new WP_Error( 'locked', 'Vector indexing is a Pro feature.', [ 'status' => 403 ] );
        }
        $count = \WP_Synapse_Vector_Store::get_instance()->build_index();
        return new WP_REST_Response( [ 'status' => 'success', 'count' => $count ], 200 );
    }

    public function get_settings() {
        $settings = \WP_Synapse_Core::get_instance()->get_settings();
        return new WP_REST_Response( $settings, 200 );
    }

    public function save_settings( $request ) {
        $params = $request->get_json_params();
        \WP_Synapse_Core::get_instance()->update_settings( $params );
        return new WP_REST_Response( [ 'status' => 'success' ], 200 );
    }

	public function search_files( $request ) {
		$query = $request->get_param( 'q' ) ?: '';
		$type = $request->get_param( 'type' ) ?: 'both'; // both, files, code

		if ( strlen( $query ) < 2 ) {
			return new WP_REST_Response( [], 200 );
		}

		$root = ABSPATH;
		$results = [];
		$found_paths = [];
		$exclude_dirs = [ 'node_modules', '.git', 'vendor', 'wp-admin', 'wp-includes', 'uploads', 'cache' ];

		// 1. Filename Search (if not 'code' only)
		if ( $type !== 'code' ) {
			$directory = new \RecursiveDirectoryIterator( $root, \RecursiveDirectoryIterator::SKIP_DOTS );
			$filter = new \RecursiveCallbackFilterIterator( $directory, function ( $current, $key, $iterator ) use ( $exclude_dirs ) {
				if ( $iterator->hasChildren() ) {
					return ! in_array( $current->getFilename(), $exclude_dirs );
				}
				return true;
			} );

			$iterator = new \RecursiveIteratorIterator( $filter, \RecursiveIteratorIterator::SELF_FIRST );

			foreach ( $iterator as $file ) {
				if ( count( $results ) >= 20 ) break;

				$filename = $file->getFilename();
				$real_path = $file->getRealPath();
				$relative_path = ltrim( str_replace( ABSPATH, '', $real_path ), DIRECTORY_SEPARATOR );

				if ( stripos( $filename, $query ) !== false ) {
					$results[] = [
						'name' => $filename,
						'path' => $relative_path,
						'type' => $file->isDir() ? 'directory' : 'file',
						'match_type' => 'filename'
					];
					$found_paths[] = $relative_path;
				}
			}
		}

		// 2. Code Search (if not 'files' only)
		if ( $type !== 'files' ) {
			// Use grep for performance if available
			$query_esc = escapeshellarg( $query );
			$root_path = untrailingslashit( ABSPATH );
			$root_esc = escapeshellarg( $root_path );
			
			// Build exclusions for grep command
			$exclude_flags = '';
			foreach ( $exclude_dirs as $dir ) {
				$exclude_flags .= " --exclude-dir=" . escapeshellarg( $dir );
			}
			
			$cmd = "grep -rIn{$exclude_flags} --include=\"*.php\" --include=\"*.js\" --include=\"*.jsx\" --include=\"*.css\" --include=\"*.html\" --include=\"*.json\" {$query_esc} {$root_esc} 2>/dev/null | head -n 50";
			
			$output = [];
			exec( $cmd, $output );

			if ( ! empty( $output ) ) {
				$code_results = [];
				foreach ( $output as $line ) {
					// Format: path:line:text
					$parts = explode( ':', $line, 3 );
					if ( count( $parts ) >= 3 ) {
						$full_path = $parts[0];
						$line_num = $parts[1];
						$line_text = trim( $parts[2] );
						
						$relative_path = ltrim( str_replace( $root_path, '', $full_path ), DIRECTORY_SEPARATOR );
						$filename = basename( $full_path );

						if ( ! isset( $code_results[$relative_path] ) ) {
							$code_results[$relative_path] = [
								'name' => $filename,
								'path' => $relative_path,
								'type' => 'file',
								'match_type' => 'code',
								'matches' => []
							];
						}

						if ( count( $code_results[$relative_path]['matches'] ) < 5 ) {
							$code_results[$relative_path]['matches'][] = [
								'line' => (int)$line_num,
								'text' => $line_text
							];
						}
					}
				}
				
				// Merge code results
				foreach ( $code_results as $rel_path => $data ) {
					$existing_index = -1;
					foreach ( $results as $idx => $res ) {
						if ( $res['path'] === $rel_path ) {
							$existing_index = $idx;
							break;
						}
					}

					if ( $existing_index === -1 ) {
						$results[] = $data;
					} else {
						$results[$existing_index]['match_type'] = 'both';
						$results[$existing_index]['matches'] = $data['matches'];
					}
				}
			}
		}

		return new WP_REST_Response( array_values( $results ), 200 );
	}

	public function check_permissions() {
		return \WP_Synapse_Security::get_instance()->check_permissions();
	}

	public function get_files( $request ) {
		$path = $request->get_param( 'path' ) ?: '';
		$root = ABSPATH;
		
		$target_dir = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		if ( ! $target_dir || ! is_dir( $target_dir ) ) {
			$target_dir = $root;
		}

        $files = $this->list_directory( $target_dir );
		return new WP_REST_Response( $files, 200 );
	}

    private function list_directory( $dir ) {
        $result = [];
        $items = @scandir( $dir );
		if ( ! $items ) return [];

        foreach ( $items as $item ) {
            if ( $item === '.' || $item === '..' || $item === '.git' || $item === 'node_modules' ) continue;

            $path = $dir . ( substr( $dir, -1 ) === DIRECTORY_SEPARATOR ? '' : DIRECTORY_SEPARATOR ) . $item;
            $relative_path = str_replace( ABSPATH, '', $path );
            $url = site_url( ltrim( str_replace( '\\', '/', $relative_path ), '/' ) );

            $is_dir = is_dir( $path );
            $result[] = [
                'name' => $item,
                'path' => $relative_path,
                'type' => $is_dir ? 'directory' : 'file',
                'url'  => $url
            ];
        }

		// Sort: directories first, then alphabetical
		usort( $result, function( $a, $b ) {
			if ( $a['type'] !== $b['type'] ) {
				return $a['type'] === 'directory' ? -1 : 1;
			}
			return strcasecmp( $a['name'], $b['name'] );
		} );

        return $result;
    }

	public function get_file_content( $request ) {
		$params = $request->get_json_params();
		$path = $params['path'] ?? '';
		
		$full_path = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		if ( ! $full_path ) {
			return new WP_REST_Response( [ 'content' => '', 'path' => $path, 'error' => 'Invalid path' ], 200 );
		}

        $content = '';
        if ( is_file( $full_path ) ) {
            $content = file_get_contents( $full_path );
        }

		return new WP_REST_Response( [
			'content' => $content,
			'path'    => $path
		], 200 );
	}



	public function save_file( $request ) {
		$params = $request->get_json_params();
		$path = $params['path'] ?? '';
		$content = $params['content'] ?? '';
		
		$full_path = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		if ( ! $full_path ) {
			return new WP_Error( 'invalid_file', 'File not found or access denied', [ 'status' => 404 ] );
		}

		$file_manager = new \WP_Synapse_File_Manager();
		$result = $file_manager->update_file( $path, $content );

		return new WP_REST_Response( $result, 200 );
	}

	public function revert_file( $request ) {
		$params = $request->get_json_params();
		$path = $params['path'] ?? '';
		
		$full_path = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		if ( ! $full_path ) {
			return new WP_Error( 'invalid_file', 'File not found or access denied', [ 'status' => 404 ] );
		}

		$file_manager = new \WP_Synapse_File_Manager();
		$result = $file_manager->revert_file( $path );

		return new WP_REST_Response( $result, 200 );
	}
	public function fix_permissions( $request ) {
		$params = $request->get_json_params();
		$path = $params['path'] ?? '';
		$mode = $params['mode'] ?? 'revert'; // 'allow' or 'revert'
		
		$full_path = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		if ( ! $full_path || ! is_dir( $full_path ) ) {
			return new WP_Error( 'invalid_path', 'Invalid directory path', [ 'status' => 400 ] );
		}

		if ( $mode === 'allow' ) {
			$this->chmod_r( $full_path, 0777, 0666 );
			return new WP_REST_Response( [ 'status' => 'success', 'message' => 'Permissions set to writable (0777)' ], 200 );
		} else {
			$this->chmod_r( $full_path, 0755, 0644 );
			return new WP_REST_Response( [ 'status' => 'success', 'message' => 'Permissions reverted to secure (0755)' ], 200 );
		}
	}




    private function chmod_r( $path, $dirModes, $fileModes ) {
        if ( is_dir( $path ) ) {
            @chmod( $path, $dirModes );
            $dh = @opendir( $path );
            if ( $dh ) {
                while ( ( $file = readdir( $dh ) ) !== false ) {
                    if ( $file != '.' && $file != '..' ) {
                        $fullpath = $path . '/' . $file;
                        if ( is_dir( $fullpath ) ) {
                            $this->chmod_r( $fullpath, $dirModes, $fileModes );
                        } else {
                            @chmod( $fullpath, $fileModes );
                        }
                    }
                }
                closedir( $dh );
            }
        } else {
            @chmod( $path, $fileModes );
        }
    }



    public function create_file( $request ) {
        $params = $request->get_json_params();
        $path = $params['path'] ?? '';
        $content = $params['content'] ?? '';
        
        $file_manager = new \WP_Synapse_File_Manager();
        $result = $file_manager->create_file( $path, $content );

        return new WP_REST_Response( $result, 200 );
    }

    public function create_folder( $request ) {
        $params = $request->get_json_params();
        $path = $params['path'] ?? '';
        
        $file_manager = new \WP_Synapse_File_Manager();
        $result = $file_manager->create_folder( $path );

        return new WP_REST_Response( $result, 200 );
    }

    public function delete_item( $request ) {
        $params = $request->get_json_params();
        $path = $params['path'] ?? '';
        
        $file_manager = new \WP_Synapse_File_Manager();
        $result = $file_manager->delete_item( $path );

        return new WP_REST_Response( $result, 200 );
    }

    public function rename_item( $request ) {
        $params = $request->get_json_params();
        $path = $params['path'] ?? '';
        $newName = $params['newName'] ?? '';
        
        $file_manager = new \WP_Synapse_File_Manager();
        $result = $file_manager->rename_item( $path, $newName );

        return new WP_REST_Response( $result, 200 );
    }

    public function duplicate_item( $request ) {
        $params = $request->get_json_params();
        $path = $params['path'] ?? '';
        $newName = $params['newName'] ?? '';
        
        $file_manager = new \WP_Synapse_File_Manager();
        $result = $file_manager->duplicate_item( $path, $newName );

        return new WP_REST_Response( $result, 200 );
    }

    public function move_item( $request ) {
        $params = $request->get_json_params();
        $path = $params['path'] ?? '';
        $newParentPath = $params['newParentPath'] ?? '';
        
        $file_manager = new \WP_Synapse_File_Manager();
        $result = $file_manager->move_item( $path, $newParentPath );

        return new WP_REST_Response( $result, 200 );
    }

	public function upload_file( $request ) {
		$path = $request->get_param( 'path' ) ?: '';
		$files = $request->get_file_params();
		
		if ( empty( $files['file'] ) ) {
			return new WP_Error( 'no_file', 'No file uploaded', [ 'status' => 400 ] );
		}

		$file = $files['file'];
		$full_dir = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		
		if ( ! $full_dir || ! is_dir( $full_dir ) ) {
			return new WP_Error( 'invalid_path', 'Invalid upload directory', [ 'status' => 400 ] );
		}

		$target_path = rtrim( $full_dir, DIRECTORY_SEPARATOR ) . DIRECTORY_SEPARATOR . $file['name'];
		
		if ( ! is_writable( $full_dir ) ) {
			return new WP_Error( 'not_writable', 'Directory is not writable: ' . $path, [ 'status' => 500 ] );
		}

		if ( move_uploaded_file( $file['tmp_name'], $target_path ) ) {
			return new WP_REST_Response( [ 'status' => 'success', 'message' => 'File uploaded successfully' ], 200 );
		}

		return new WP_Error( 'upload_failed', 'Failed to move uploaded file. Check server permissions.', [ 'status' => 500 ] );
	}

	public function zip_item( $request ) {
		$params = $request->get_json_params();
		$path = $params['path'] ?? '';
		
		$full_path = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		if ( ! $full_path || ! file_exists( $full_path ) ) {
			return new WP_Error( 'invalid_path', 'Path not found', [ 'status' => 400 ] );
		}

		if ( ! class_exists( 'ZipArchive' ) ) {
			return new WP_Error( 'no_zip', 'ZipArchive class not found on server', [ 'status' => 500 ] );
		}

		$zip_path = $full_path . '.zip';
		
		if ( ! is_writable( dirname( $zip_path ) ) ) {
			return new WP_Error( 'not_writable', 'Cannot create ZIP: Parent directory is not writable. Please check permissions.', [ 'status' => 500 ] );
		}

		$zip = new ZipArchive();
		$res = $zip->open( $zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE );
		
		if ( $res !== TRUE ) {
			return new WP_Error( 'zip_fail', 'Could not create zip file (Error code: ' . $res . ')', [ 'status' => 500 ] );
		}

		if ( is_dir( $full_path ) ) {
			// Ensure full_path doesn't end with a slash for consistent relative path calculation
			$normalized_root = rtrim( $full_path, DIRECTORY_SEPARATOR );
			$files = new RecursiveIteratorIterator( 
				new RecursiveDirectoryIterator( $normalized_root, RecursiveDirectoryIterator::SKIP_DOTS ), 
				RecursiveIteratorIterator::LEAVES_ONLY 
			);
			
			foreach ( $files as $name => $file ) {
				if ( ! $file->isDir() ) {
					$filePath = $file->getRealPath();
					$relativePath = ltrim( substr( $filePath, strlen( $normalized_root ) ), DIRECTORY_SEPARATOR );
					$zip->addFile( $filePath, $relativePath );
				}
			}
		} else {
			$zip->addFile( $full_path, basename( $full_path ) );
		}

		$zip->close();
		return new WP_REST_Response( [ 'status' => 'success', 'zip_path' => str_replace( ABSPATH, '', $zip_path ) ], 200 );
	}

	public function unzip_item( $request ) {
		$params = $request->get_json_params();
		$path = $params['path'] ?? '';
		
		$full_path = \WP_Synapse_Security::get_instance()->sanitize_path( $path );
		if ( ! $full_path || ! is_file( $full_path ) || strtolower( pathinfo( $full_path, PATHINFO_EXTENSION ) ) !== 'zip' ) {
			return new WP_Error( 'invalid_file', 'Not a valid ZIP file', [ 'status' => 400 ] );
		}

		if ( ! class_exists( 'ZipArchive' ) ) {
			return new WP_Error( 'no_zip', 'ZipArchive class not found on server', [ 'status' => 500 ] );
		}

		$target_dir = dirname( $full_path );
		
		if ( ! is_writable( $target_dir ) ) {
			return new WP_Error( 'not_writable', 'Destination directory is not writable. Please check permissions.', [ 'status' => 500 ] );
		}

		$zip = new ZipArchive();
		$res = $zip->open( $full_path );
		
		if ( $res === TRUE ) {
			$extracted = $zip->extractTo( $target_dir );
			$zip->close();
			
			if ( $extracted ) {
				return new WP_REST_Response( [ 'status' => 'success', 'message' => 'Extracted successfully to ' . basename( $target_dir ) ], 200 );
			} else {
				return new WP_Error( 'extract_fail', 'Failed to extract files. The ZIP might be corrupted or permissions might have changed.', [ 'status' => 500 ] );
			}
		}

		$error_msg = 'Could not open ZIP file.';
		if ( $res === ZipArchive::ER_NOENT ) $error_msg = 'ZIP file does not exist.';
		if ( $res === ZipArchive::ER_READ ) $error_msg = 'Read error while opening ZIP.';
		
		return new WP_Error( 'unzip_fail', $error_msg . ' (Error code: ' . $res . ')', [ 'status' => 500 ] );
	}
}
