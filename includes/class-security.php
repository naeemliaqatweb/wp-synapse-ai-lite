<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WP_Synapse_Security {

	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {}

	public function check_permissions() {
		return current_user_can( 'manage_options' ) && wsaltuwifm_fs()->is_registered() && wsaltuwifm_fs()->can_use_premium_code();
	}

	public function validate_nonce( $request ) {
		$nonce = $request->get_header( 'X-WP-Nonce' );
		return wp_verify_nonce( $nonce, 'wp_rest' );
	}

	public function sanitize_path( $path ) {
		$root = str_replace( '\\', '/', ABSPATH );
        $path = str_replace( '\\', '/', $path );
        
        // Remove leading slash for safe concatenation
        $path = ltrim( $path, '/' );
        $full_path = trailingslashit( $root ) . $path;

        // Use realpath only to resolve dots, but don't fail if the file doesn't exist
        $normalized_path = str_replace( '\\', '/', $full_path );
        
        // Simple directory traversal check: ensure ABSPATH is at the start
        if ( strpos( $normalized_path, $root ) !== 0 ) {
            return false;
        }

        // Additional safeguard: prevent '..' in the path
        if ( strpos( $path, '..' ) !== false ) {
            return false;
        }
        
		return $normalized_path;
	}
}
