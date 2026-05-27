<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Helper to check if the user is a paying or trial premium user.
 */
function wp_synapse_ai_is_premium_user() {
    return wp_synapse_ai_fs()->can_use_premium_code();
}

/**
 * Helper to check if a specific feature is accessible.
 */
function wp_synapse_ai_can_access_feature( $feature ) {
    $basic_features = [ 'monaco_editor', 'file_manager', 'basic_search', 'theme_toggle', 'uploads' ];
    if ( in_array( $feature, $basic_features ) ) {
        return true;
    }
    // Pro features require premium status
    return wp_synapse_ai_is_premium_user();
}

/**
 * Check if we should display the Upgrade CTA card.
 */
function wp_synapse_ai_show_upgrade_cta() {
    return ! wp_synapse_ai_is_premium_user();
}

// Add a filter to modify dynamic plugin settings or premium capabilities
add_filter( 'wp_synapse_ai_is_premium', 'wp_synapse_ai_is_premium_user' );
