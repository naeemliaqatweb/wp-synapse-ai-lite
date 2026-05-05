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

            $is_dir = is_dir( $path );
            $result[] = [
                'name' => $item,
                'path' => $relative_path,
                'type' => $is_dir ? 'directory' : 'file'
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
}
