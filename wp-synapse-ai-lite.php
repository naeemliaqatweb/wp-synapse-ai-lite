<?php
/**
 * Plugin Name: Synapse Lite – AI Code Editor
 * Plugin URI: https://example.com/wp-synapse-ai-lite
 * Description: A powerful AI-assisted code editor for WordPress (Lite Version).
 * Version: 1.0.0
 * Author: Naeem Liaqat
 * Author URI: https://example.com
 * Text Domain: wp-synapse-ai-lite
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Define Constants
define( 'WP_SYNAPSE_AI_LITE_VERSION', '1.0.0' );
define( 'WP_SYNAPSE_AI_LITE_PATH', plugin_dir_path( __FILE__ ) );
define( 'WP_SYNAPSE_AI_LITE_URL', plugin_dir_url( __FILE__ ) );

// Autoloader (Simple PSR-4-like for includes)
spl_autoload_register( function ( $class ) {
	$prefix = 'WP_Synapse_';
	$base_dir = WP_SYNAPSE_AI_LITE_PATH . 'includes/';

	$len = strlen( $prefix );
	if ( strncmp( $prefix, $class, $len ) !== 0 ) {
		return;
	}

	$relative_class = substr( $class, $len );
	$file = $base_dir . 'class-' . strtolower( str_replace( '_', '-', $relative_class ) ) . '.php';

	if ( file_exists( $file ) ) {
		require $file;
	}
} );

// Initialize the plugin
function wp_synapse_ai_lite_init() {
	if ( class_exists( 'WP_Synapse_Core' ) ) {
		\WP_Synapse_Core::get_instance();
	}
}
add_action( 'plugins_loaded', 'wp_synapse_ai_lite_init' );

// Activation
register_activation_hook( __FILE__, function() {
    if ( class_exists( 'WP_Synapse_Core' ) ) {
        \WP_Synapse_Core::create_tables();
    }
});

// Plugin Action Links
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), function( $links ) {
    $settings_link = '<a href="admin.php?page=wp-synapse-ai-lite-settings">' . __( 'Settings', 'wp-synapse-ai-lite' ) . '</a>';
    $file_manager_link = '<a href="admin.php?page=wp-synapse-ai-lite">' . __( 'File Manager', 'wp-synapse-ai-lite' ) . '</a>';
    array_unshift( $links, $settings_link, $file_manager_link );
    return $links;
});
