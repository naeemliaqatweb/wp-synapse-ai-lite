<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WP_Synapse_Vector_Store {

	private static $instance = null;
    private $index_file = '';

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
        $upload_dir = wp_upload_dir();
        $this->index_file = $upload_dir['basedir'] . '/wp-synapse-index.json';
    }

    public function build_index() {
        $root = ABSPATH;
        $index = [];
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator( $root, RecursiveDirectoryIterator::SKIP_DOTS ),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ( $iterator as $file ) {
            $path = $file->getPathname();
            $relative_path = str_replace( ABSPATH, '', $path );

            // Skip large/junk directories
            if ( strpos( $relative_path, 'node_modules' ) !== false || 
                 strpos( $relative_path, '.git' ) !== false || 
                 strpos( $relative_path, 'vendor' ) !== false ||
                 strpos( $relative_path, 'wp-admin' ) !== false ||
                 strpos( $relative_path, 'wp-includes' ) !== false ) {
                continue;
            }

            if ( $file->isFile() ) {
                $ext = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
                $allowed_exts = [ 'php', 'js', 'jsx', 'css', 'html', 'txt', 'md', 'json' ];
                
                if ( in_array( $ext, $allowed_exts ) ) {
                    $index[] = [
                        'name' => $file->getFilename(),
                        'path' => $relative_path,
                        'size' => $file->getSize(),
                        'modified' => $file->getMTime()
                    ];
                }
            }

            if ( count( $index ) > 5000 ) break; // Safety limit
        }

        file_put_contents( $this->index_file, json_encode( $index ) );
        return count( $index );
    }

    public function get_index() {
        if ( ! file_exists( $this->index_file ) ) {
            return [];
        }
        return json_decode( file_get_contents( $this->index_file ), true );
    }
}
