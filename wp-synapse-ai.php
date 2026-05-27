<?php
/**
 * Plugin Name: Synapse Pro – AI Code Editor
 * Plugin URI: https://synapse.com
 * Description: The ultimate professional IDE for WordPress. Features advanced global code search (grep), visual side-by-side Diff mode, Monaco Editor (VS Code engine), and enterprise file management.
 * Version: 1.0.1
 * Author: Synapse Team
 * Author URI: https://synapse.com
 * Text Domain: wp-synapse-ai
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Create a helper function for easy Freemius SDK access.
function wp_synapse_ai_fs() {
    global $wp_synapse_ai_fs;

    if ( ! isset( $wp_synapse_ai_fs ) ) {
        // Include Freemius SDK.
        if ( file_exists( dirname( __FILE__ ) . '/freemius/start.php' ) ) {
            require_once dirname( __FILE__ ) . '/freemius/start.php';
        }

        $wp_synapse_ai_fs = fs_dynamic_init( [
            'id'                  => '30668',
            'slug'                => basename( dirname( __FILE__ ) ),
            'type'                => 'plugin',
            'public_key'          => 'pk_e358b5e20ac05e94b2a8d5621de4e',
            'is_premium'          => false,
            'has_addons'          => false,
            'has_paid_plans'      => true,
            'trial'               => [
                'days'               => 7,
                'is_require_payment' => false,
            ],
            'menu'                => [
                'slug'           => 'wp-synapse-ai',
                'first-path'     => 'admin.php?page=wp-synapse-ai',
                'support'        => true,
                'account'        => true, // Automatically handles account / licensing views
            ],
        ] );
    }

    return $wp_synapse_ai_fs;
}

// Init Freemius.
wp_synapse_ai_fs();
do_action( 'wp_synapse_ai_fs_loaded' );

// Define Constants
define( 'WP_SYNAPSE_AI_VERSION', '1.0.1' );
define( 'WP_SYNAPSE_AI_PATH', plugin_dir_path( __FILE__ ) );
define( 'WP_SYNAPSE_AI_URL', plugin_dir_url( __FILE__ ) );

// Autoloader (Simple PSR-4-like for includes)
spl_autoload_register( function ( $class ) {
	$prefix = 'WP_Synapse_';
	$base_dir = WP_SYNAPSE_AI_PATH . 'includes/';

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
function wp_synapse_ai_init() {
	if ( class_exists( 'WP_Synapse_Core' ) ) {
		\WP_Synapse_Core::get_instance();
	}
}
add_action( 'plugins_loaded', 'wp_synapse_ai_init' );

// Activation
register_activation_hook( __FILE__, function() {
    if ( class_exists( 'WP_Synapse_Core' ) ) {
        \WP_Synapse_Core::create_tables();
    }
});

// Load Premium admin / upsell components unconditionally (they gate themselves internally)
if ( file_exists( WP_SYNAPSE_AI_PATH . 'premium/premium-admin.php' ) ) {
    require_once WP_SYNAPSE_AI_PATH . 'premium/premium-admin.php';
}

// Load Premium logic conditionally
if ( wp_synapse_ai_fs()->can_use_premium_code() ) {
    if ( file_exists( WP_SYNAPSE_AI_PATH . 'premium/premium-loader.php' ) ) {
        require_once WP_SYNAPSE_AI_PATH . 'premium/premium-loader.php';
    }
}
