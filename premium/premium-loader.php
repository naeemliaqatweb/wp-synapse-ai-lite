<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load premium logic files
require_once dirname( __FILE__ ) . '/premium-features.php';
require_once dirname( __FILE__ ) . '/premium-admin.php';

// Action hook to announce premium activation
add_action( 'wp_synapse_ai_premium_init', function() {
    error_log( 'WP Synapse AI Premium features successfully unlocked via Freemius SDK.' );
} );

// Trigger initialization
do_action( 'wp_synapse_ai_premium_init' );
