<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WP_Synapse_Core {

	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

    public static function create_tables() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'synapse_chats_lite';
       		// Initial check for upload directory
		$upload_dir = wp_upload_dir();
		$backup_dir = $upload_dir['basedir'] . '/wp-synapse-backups';
		if ( ! file_exists( $backup_dir ) ) {
			wp_mkdir_p( $backup_dir );
		}
	}

	private function __construct() {
		$this->init_hooks();
		// Initialize Sub-components
		\WP_Synapse_API::get_instance();
		\WP_Synapse_Security::get_instance();
	}

	private function init_hooks() {
		add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
	}

	public function register_admin_menu() {
		add_menu_page(
			__( 'Synapse Lite – AI Code Editor', 'wp-synapse-ai-lite' ),
			__( 'Synapse Lite', 'wp-synapse-ai-lite' ),
			'manage_options',
			'wp-synapse-ai-lite',
			[ $this, 'render_admin_page' ],
			'dashicons-superhero',
			25
		);

		add_submenu_page(
			'wp-synapse-ai-lite',
			__( 'File Manager', 'wp-synapse-ai-lite' ),
			__( 'File Manager', 'wp-synapse-ai-lite' ),
			'manage_options',
			'wp-synapse-ai-lite',
			[ $this, 'render_admin_page' ]
		);

		add_submenu_page(
			'wp-synapse-ai-lite',
			__( 'How to Use', 'wp-synapse-ai-lite' ),
			__( 'How to Use', 'wp-synapse-ai-lite' ),
			'manage_options',
			'wp-synapse-ai-lite-how-to-use',
			[ $this, 'render_how_to_use_page' ]
		);

		add_submenu_page(
			'wp-synapse-ai-lite',
			__( 'Pro Version', 'wp-synapse-ai-lite' ),
			__( 'Pro Version (Soon)', 'wp-synapse-ai-lite' ),
			'manage_options',
			'wp-synapse-ai-lite-pro',
			[ $this, 'render_pro_page' ]
		);


	}

	public function render_admin_page() {
		echo '<div id="wp-synapse-ai-lite-root"></div>';
	}

	public function render_settings_page() {
		echo '<div id="wp-synapse-ai-lite-settings-root"></div>';
	}

	public function render_pricing_page() {
		echo '<div id="wp-synapse-ai-lite-pricing-root"></div>';
	}

	public function render_pro_page() {
		echo '<style>
			@keyframes synapseFadeIn {
				from { opacity: 0; transform: translateY(10px); }
				to { opacity: 1; transform: translateY(0); }
			}
			.synapse-animate {
				animation: synapseFadeIn 0.6s ease-out forwards;
			}
		</style>';
		echo '<div class="synapse-animate" style="padding: 60px 40px; text-align: center; background: #0f172a; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: \'Inter\', sans-serif; background-image: radial-gradient(circle at top right, #1e1b4b, #0f172a); overflow-y: auto;">';
		echo '<div style="padding: 80px 60px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6); max-width: 700px; width: 90%;">';
		echo '<div style="display: inline-block; padding: 10px 20px; background: rgba(99, 102, 241, 0.2); border-radius: 24px; color: #818cf8; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px;">Upcoming Release</div>';
		echo '<h1 style="font-size: 4rem; font-weight: 900; margin: 0 0 40px 0; padding: 20px 0; background: linear-gradient(135deg, #fff 0%, #94a3b8 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -2px; line-height: 1.1;">Pro Version</h1>';
		echo '<p style="font-size: 1.3rem; color: #94a3b8; line-height: 1.8; margin-bottom: 50px;">Experience the power of a fully autonomous AI coding agent. Multi-file editing, cloud syncing, and advanced neural models for effortless WordPress development.</p>';
		echo '<button style="padding: 20px 50px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; border: none; border-radius: 16px; font-size: 1.2rem; font-weight: 700; cursor: pointer; box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.5); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">Stay Tuned</button>';
		echo '</div>';
		echo '</div>';
	}	public function render_how_to_use_page() {
		$hero_img = WP_SYNAPSE_AI_LITE_URL . 'public/how-to-use.png';
		$interface_img = WP_SYNAPSE_AI_LITE_URL . 'public/interface-preview.png';
		
		echo '<div style="padding: 30px; background: #0f172a; color: #f1f5f9; min-height: 100vh; font-family: \'Inter\', sans-serif; display: block; visibility: visible; opacity: 1;">';
		echo '<div style="max-width: 1100px; margin: 0 auto;">';
		
		// Header Section
		echo '<div style="margin-bottom: 50px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 30px;">';
		echo '<h1 style="font-size: 2.2rem; font-weight: 800; margin: 0 0 10px 0; color: #fff;">Synapse Lite Documentation</h1>';
		echo '<p style="font-size: 1.1rem; color: #94a3b8; margin: 0;">Everything you need to know to get started with the ultimate WP code editor.</p>';
		echo '</div>';

		// Top Section: Images Side by Side (Smaller)
		echo '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">';
		echo '<div style="border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 20px rgba(0,0,0,0.3);">';
		echo '<img src="' . esc_url($hero_img) . '" style="width: 100%; display: block;" alt="Branded Concept">';
		echo '</div>';
		echo '<div style="border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 20px rgba(0,0,0,0.3);">';
		echo '<img src="' . esc_url($interface_img) . '" style="width: 100%; display: block;" alt="Real Interface">';
		echo '</div>';
		echo '</div>';

		// Guide Steps Section
		echo '<h2 style="font-size: 1.5rem; color: #fff; margin-bottom: 25px;">Quick Start Guide</h2>';
		echo '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;">';
		
		$steps = [
			['1', 'Access File Manager', 'Navigate to the <strong>File Manager</strong> menu. You will see a file tree on the left containing your WordPress theme and plugin files.', '#6366f1'],
			['2', 'Open & Edit Files', 'Click any file to open it in the high-performance code editor. Use <strong>Ctrl + S</strong> to save your changes instantly.', '#8b5cf6'],
			['3', 'Manage Structure', 'Right-click on files and folders to rename, delete, or create new items directly within the interface.', '#ec4899']
		];

		foreach ($steps as $step) {
			echo '<div style="background: rgba(30, 41, 59, 0.5); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s;">';
			echo '<div style="width: 32px; height: 32px; background: ' . $step[3] . '; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; margin-bottom: 15px;">' . $step[0] . '</div>';
			echo '<h3 style="font-size: 1.1rem; margin-bottom: 10px; color: #fff;">' . $step[1] . '</h3>';
			echo '<p style="color: #94a3b8; line-height: 1.5; font-size: 0.95rem; margin: 0;">' . $step[2] . '</p>';
			echo '</div>';
		}

		echo '</div>';

		// Pro Tip Section (Compact)
		echo '<div style="background: linear-gradient(90deg, #1e1b4b, #1e293b); padding: 25px; border-radius: 12px; border-left: 4px solid #6366f1;">';
		echo '<h3 style="font-size: 1.2rem; margin-bottom: 10px; color: #fff; display: flex; align-items: center; gap: 10px;"><span style="background: #6366f1; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">PRO TIP</span> Dark Mode Visibility</h3>';
		echo '<p style="color: #94a3b8; font-size: 1rem; line-height: 1.5; margin: 0;">You can toggle between Light and Dark mode using the icon at the top of the file tree sidebar. This setting is saved locally for your next session.</p>';
		echo '</div>';

		echo '</div>';
		echo '</div>';
	}	}

	public function enqueue_admin_assets( $hook ) {
		if ( $hook === 'plugins.php' ) {
			wp_enqueue_script( 'wp-synapse-ai-lite-deactivation', WP_SYNAPSE_AI_LITE_URL . 'admin/assets/js/deactivation.js', [ 'jquery' ], WP_SYNAPSE_AI_LITE_VERSION, true );
		}

		if ( strpos( $hook, 'wp-synapse-ai-lite' ) === false ) {
			return;
		}

		// Enqueue React application
		// In production, we'd point to the built files.
		// For development, we'll check for a local dev server or use built files.
		$is_dev = defined( 'WP_SYNAPSE_AI_LITE_DEV' ) && WP_SYNAPSE_AI_LITE_DEV;

		if ( $is_dev ) {
			wp_enqueue_script( 'wp-synapse-ai-lite-vite', 'http://localhost:5173/@vite/client', [], null, true );
			wp_enqueue_script( 'wp-synapse-ai-lite-app', 'http://localhost:5173/src/main.jsx', [ 'wp-synapse-ai-lite-vite' ], null, true );
		} else {
			// Production build enqueuing
			if ( file_exists( WP_SYNAPSE_AI_LITE_PATH . 'build/assets/index.js' ) ) {
				wp_enqueue_script( 'wp-synapse-ai-lite-app', WP_SYNAPSE_AI_LITE_URL . 'build/assets/index.js', [], WP_SYNAPSE_AI_LITE_VERSION, true );
				wp_enqueue_style( 'wp-synapse-ai-lite-style', WP_SYNAPSE_AI_LITE_URL . 'build/assets/index.css', [], WP_SYNAPSE_AI_LITE_VERSION );
			}
		}

		wp_localize_script( 'wp-synapse-ai-lite-app', 'wpSynapseAILite', [
			'root' => esc_url_raw( rest_url( 'wp-synapse-ai-lite/v1' ) ),
			'nonce' => wp_create_nonce( 'wp_rest' ),
		] );
	}
}
