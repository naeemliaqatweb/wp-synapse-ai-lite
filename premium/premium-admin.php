<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Add "Upgrade to Pro" menu option in WP admin if not premium
add_action( 'admin_menu', function() {
    global $wp_synapse_ai_fs;
    
    if ( isset($wp_synapse_ai_fs) && ! $wp_synapse_ai_fs->can_use_premium_code() ) {
        add_submenu_page(
            'wp-synapse-ai',
            __( 'Upgrade to Pro', 'wp-synapse-ai' ),
            '<span style="color: #6366f1; font-weight: bold;">⭐ ' . __( 'Upgrade to Pro', 'wp-synapse-ai' ) . '</span>',
            'manage_options',
            'wp-synapse-ai-upgrade',
            function() {
                // Redirect user directly to the Freemius checkout / pricing page
                $checkout_url = wp_synapse_ai_fs()->get_upgrade_url();
                echo '<div style="padding: 30px; text-align: center; font-family: sans-serif;">';
                echo '<h2>' . esc_html__( 'Redirecting to checkout...', 'wp-synapse-ai' ) . '</h2>';
                echo '<p>' . sprintf( __( 'If you are not redirected automatically, <a href="%s">click here</a>.', 'wp-synapse-ai' ), esc_url( $checkout_url ) ) . '</p>';
                echo '</div>';
                echo '<script>window.location.href = "' . esc_url( $checkout_url ) . '";</script>';
                exit;
            }
        );
    }
}, 30 );

// Renders a non-obtrusive notice in the plugin page inviting users to upgrade
add_action( 'admin_notices', function() {
    $screen = get_current_screen();
    if ( $screen && strpos( $screen->id, 'wp-synapse-ai' ) !== false ) {
        if ( ! wp_synapse_ai_fs()->can_use_premium_code() ) {
            ?>
            <div class="notice notice-info is-dismissible" style="border-left-color: #6366f1; padding: 12px; margin-top: 15px;">
                <p style="font-size: 14px; margin: 0 0 8px 0;">
                    <strong><?php _e( 'Want more power?', 'wp-synapse-ai' ); ?></strong> 
                    <?php _e( 'Upgrade to Synapse Pro to unlock advanced AI code assistants, git integrations, secure ZIP extractions, and multi-file comparisons.', 'wp-synapse-ai' ); ?>
                </p>
                <p style="margin: 0;">
                    <a href="<?php echo esc_url( wp_synapse_ai_fs()->get_upgrade_url() ); ?>" class="button button-primary" style="background: #6366f1; border-color: #4f46e5; font-weight: bold;"><?php _e( 'Upgrade to Pro', 'wp-synapse-ai' ); ?></a>
                    <a href="<?php echo esc_url( wp_synapse_ai_fs()->get_trial_url() ); ?>" class="button button-secondary" style="margin-left: 5px;"><?php _e( 'Start 7-Day Free Trial', 'wp-synapse-ai' ); ?></a>
                </p>
            </div>
            <?php
        }
    }
} );
