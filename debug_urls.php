<?php
require_once( '/var/www/html/pld/wp-load.php' );
echo "ABSPATH: " . ABSPATH . "\n";
echo "site_url: " . site_url() . "\n";
echo "home_url: " . home_url() . "\n";
echo "Relative path test: wp-content/plugins/test.png\n";
echo "Result of site_url: " . site_url( 'wp-content/plugins/test.png' ) . "\n";
