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
		register_rest_route( 'wp-synapse-ai-lite/v1', '/files', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'get_files' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/file-content', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'get_file_content' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );



		register_rest_route( 'wp-synapse-ai-lite/v1', '/save-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'save_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/revert-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'revert_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );




        


		register_rest_route( 'wp-synapse-ai-lite/v1', '/create-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'create_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/create-folder', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'create_folder' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/delete-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'delete_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/rename-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'rename_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/fix-permissions', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'fix_permissions' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );
		
		register_rest_route( 'wp-synapse-ai-lite/v1', '/upload-file', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'upload_file' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/zip-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'zip_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/unzip-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'unzip_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );
		
		register_rest_route( 'wp-synapse-ai-lite/v1', '/search-files', [
			'methods'             => 'GET',
			'callback'            => [ $this, 'search_files' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/duplicate-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'duplicate_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );

		register_rest_route( 'wp-synapse-ai-lite/v1', '/move-item', [
			'methods'             => 'POST',
			'callback'            => [ $this, 'move_item' ],
			'permission_callback' => [ $this, 'check_permissions' ],
		] );
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

		// 1. Filename Search (if not 'code' only)
		if ( $type !== 'code' ) {
			$iterator = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $root, \RecursiveDirectoryIterator::SKIP_DOTS ),
				\RecursiveIteratorIterator::SELF_FIRST
			);

			foreach ( $iterator as $file ) {
				if ( count( $results ) >= 20 ) break;

				$filename = $file->getFilename();
				$path = $file->getPathname();

				if ( strpos( $path, 'node_modules' ) !== false || 
					 strpos( $path, '.git' ) !== false || 
					 strpos( $path, 'vendor' ) !== false ) {
					continue;
				}

				if ( stripos( $filename, $query ) !== false ) {
					$real_path = $file->getRealPath();
					$relative_path = ltrim( str_replace( ABSPATH, '', $real_path ), DIRECTORY_SEPARATOR );
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
			
			// Use individual exclude flags instead of brace expansion for better shell compatibility
			// Added -E for extended regex support just in case, and simplified include
			$cmd = "grep -rIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=vendor --include=\"*.php\" --include=\"*.js\" --include=\"*.jsx\" --include=\"*.css\" --include=\"*.html\" --include=\"*.json\" {$query_esc} {$root_esc} 2>/dev/null | head -n 50";
			
			$output = [];
			exec( $cmd, $output );

			if ( ! empty( $output ) ) {
				$code_results = [];
				foreach ( $output as $line ) {
					// Format: path:line:text
					// Use a more robust split because paths might contain colons on some systems (though unlikely here)
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
