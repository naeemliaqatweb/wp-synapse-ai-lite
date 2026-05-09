<?php
/**
 * Plugin Name: Synapse Lite – AI Code Editor
 * Plugin URI: https://synapse.com
 * Description: The ultimate professional IDE for WordPress. Features advanced global code search (grep), visual side-by-side Diff mode, Monaco Editor (VS Code engine), and enterprise file management.
 * Version: 1.0.1
 * Author: Synapse Team
 * Author URI: https://synapse.com
 * Text Domain: wp-synapse-ai-lite
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! function_exists( 'wsaltuwifm_fs' ) ) {
    // Create a helper function for easy SDK access.
    function wsaltuwifm_fs() {
        global $wsaltuwifm_fs;

        if ( ! isset( $wsaltuwifm_fs ) ) {
            // Include Freemius SDK.
            require_once dirname( __FILE__ ) . '/vendor/freemius/start.php';

            $wsaltuwifm_fs = fs_dynamic_init( array(
                'id'                  => '29361',
                'slug'                => 'wp-synapse-ai-lite-the-ultimate-wordpress-ide-file-manager',
                'type'                => 'plugin',
                'public_key'          => 'pk_d7c9b7d63df54a933d98d73245932',
                'is_premium'          => true,
                'is_premium_only'     => true,
                'has_addons'          => false,
                'has_paid_plans'      => true,
                'is_org_compliant'    => true,
                // Automatically removed in the free version. If you're not using the
                // auto-generated free version, delete this line before uploading to wp.org.
                'wp_org_gatekeeper'   => 'OA7#BoRiBNqdf52FvzEf!!074aRLPs8fspif$7K1#4u4Csys1fQlCecVcUTOs2mcpeVHi#C2j9d09fOTvbC0HloPT7fFee5WdS3G',
                'menu'                => array(
                    'support'        => false,
                ),
            ) );
        }

        return $wsaltuwifm_fs;
    }

    // Init Freemius.
    wsaltuwifm_fs();
    // Signal that SDK was initiated.
    do_action( 'wsaltuwifm_fs_loaded' );
}

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Define Constants
define( 'WP_SYNAPSE_AI_LITE_VERSION', '1.0.1' );
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
    $file_manager_link = '<a href="admin.php?page=wp-synapse-ai-lite">' . __( 'File Manager', 'wp-synapse-ai-lite' ) . '</a>';
    $site_link = '<a href="https://synapse.com" target="_blank">' . __( 'Synapse AI', 'wp-synapse-ai-lite' ) . '</a>';
    array_unshift( $links, $file_manager_link, $site_link );
    return $links;
});
