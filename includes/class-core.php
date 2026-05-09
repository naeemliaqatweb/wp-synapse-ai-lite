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

	public function render_permissions_page() {
		// Handle POST action first to ensure UI reflects changes
		$message = '';
		if ( isset($_POST['synapse_action']) && check_admin_referer('synapse_fix_perms') ) {
			$fix_path = $_POST['synapse_fix_path'];
			$action = $_POST['synapse_action'];
			
			if ( $action === 'fix' ) {
				$success = $this->chmod_recursive($fix_path, 0777, 0666);
				clearstatcache(true, $fix_path);
				if ( is_writable($fix_path) ) {
					$message = '<div style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">Permissions granted successfully!</div>';
				} else {
					$ssh_cmd = "chmod -R 777 " . str_replace(ABSPATH, '', $fix_path);
					$message = '<div style="margin-bottom: 20px; padding: 20px; background: rgba(239, 68, 68, 0.1); color: #f87171; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2); line-height: 1.6;">';
					$message .= '<strong style="display: block; margin-bottom: 10px;">Server Restriction Detected:</strong>';
					$message .= 'Your web server is preventing PHP from changing folder permissions. This is a common security setting on managed hosts.';
					$message .= '<div style="margin-top: 15px; background: #000; padding: 12px; border-radius: 6px; color: #fff; font-family: monospace; font-size: 0.85rem; border: 1px solid #444;"># Run this via SSH:<br>sudo ' . $ssh_cmd . '</div>';
					$message .= '</div>';
				}
			} else {
				$this->chmod_recursive($fix_path, 0755, 0644);
				clearstatcache(true, $fix_path);
				$message = '<div style="margin-bottom: 20px; padding: 15px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">Permissions reverted to secure state.</div>';
			}
		}

		$target_dirs = [
			'Themes' => ABSPATH . 'wp-content/themes',
			'Plugins' => ABSPATH . 'wp-content/plugins'
		];

		echo '<div style="padding: 20px; background: #0f172a !important; color: #fff !important; font-family: \'Inter\', sans-serif !important; display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 800px; position: relative; z-index: 99;">';
		echo '<div style="max-width: 800px; margin: 0 auto;">';
		
		echo '<div style="margin-bottom: 40px;">';
		echo '<h1 style="font-size: 2.5rem; font-weight: 800; margin: 0 0 10px 0; color: #fff;">Permissions Manager</h1>';
		echo '<p style="font-size: 1.1rem; color: #94a3b8;">Resolve file write permission issues for seamless theme and plugin development.</p>';
		echo '</div>';

		if ( $message ) echo $message;

		echo '<div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">';
		echo '<strong style="color: #fff; display: block; margin-bottom: 8px;">Important Notice:</strong>';
		echo 'For the editor to save changes, your theme and plugin directories must be writable by the server. If you encounter "Permission Denied" errors, use this tool to temporarily grant write access.';
		echo '</div>';

		echo '<div style="background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">';
		
		foreach ( $target_dirs as $label => $path ) {
			clearstatcache(true, $path);
			$is_writable = is_writable( $path );
			$status_color = $is_writable ? '#10b981' : '#f87171';
			$status_text = $is_writable ? 'Write/Read' : 'Read-only';

			echo '<div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: rgba(30, 41, 59, 0.5); border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.05);">';
			echo '<div>';
			echo '<h3 style="margin: 0 0 5px 0; color: #fff;">' . esc_html($label) . '</h3>';
			echo '<code style="font-size: 0.8rem; background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #94a3b8;">' . esc_html(str_replace(ABSPATH, '', $path)) . '</code>';
			echo '</div>';
			
			echo '<div style="text-align: right; display: flex; align-items: center; gap: 20px;">';
			echo '<span style="color: ' . $status_color . '; font-weight: 600; font-size: 0.9rem;">' . $status_text . '</span>';
			
			echo '<form method="post" style="margin: 0;">';
			echo '<input type="hidden" name="synapse_fix_path" value="' . esc_attr($path) . '">';
			wp_nonce_field( 'synapse_fix_perms' );
			if ( !$is_writable ) {
				echo '<button type="submit" name="synapse_action" value="fix" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Grant Access</button>';
			} else {
				echo '<button type="submit" name="synapse_action" value="revert" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Secure Folder</button>';
			}
			echo '</form>';
			
			echo '</div>';
			echo '</div>';
		}

		echo '</div>';
		echo '</div>';
		echo '</div>';
	}

	private function chmod_recursive($path, $dirModes, $fileModes) {
		if (is_dir($path)) {
			@chmod($path, $dirModes);
			$dh = @opendir($path);
			if ($dh) {
				while (($file = readdir($dh)) !== false) {
					if ($file != '.' && $file != '..') {
						$fullpath = $path . '/' . $file;
						if (is_dir($fullpath)) {
							$this->chmod_recursive($fullpath, $dirModes, $fileModes);
						} else {
							@chmod($fullpath, $fileModes);
						}
					}
				}
				closedir($dh);
			}
		} else {
			@chmod($path, $fileModes);
		}
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
	}

	public function render_how_to_use_page() {
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
	}

	public function enqueue_admin_assets( $hook ) {
		error_log( 'Synapse Lite Hook: ' . $hook );
		if ( $hook === 'plugins.php' ) {
			wp_enqueue_script( 'wp-synapse-ai-lite-deactivation', WP_SYNAPSE_AI_LITE_URL . 'admin/assets/js/deactivation.js', [ 'jquery' ], WP_SYNAPSE_AI_LITE_VERSION, true );
		}

		if ( strpos( $hook, 'synapse' ) === false ) {
			return;
		}

		// Enqueue React application
		// In production, we'd point to the built files.
		// For development, we'll check for a local dev server or use built files.
		$is_dev = defined( 'WP_SYNAPSE_AI_LITE_DEV' ) && WP_SYNAPSE_AI_LITE_DEV;

		if ( $is_dev ) {
			wp_enqueue_script( 'wp-synapse-ai-lite-vite', 'http://localhost:5173/@vite/client', [], null, true );
			wp_enqueue_script( 'wp-synapse-ai-lite-app', 'http://localhost:5173/src/main.jsx', [ 'wp-synapse-ai-lite-vite', 'wp-i18n', 'jquery' ], null, true );
		} else {
			// Production build enqueuing
			$dist_path = WP_SYNAPSE_AI_LITE_PATH . 'admin/dist/assets/';
			$dist_url  = WP_SYNAPSE_AI_LITE_URL . 'admin/dist/assets/';
			
			if ( file_exists( $dist_path . 'index.js' ) ) {
				wp_enqueue_script( 'wp-synapse-ai-lite-app', $dist_url . 'index.js', [ 'wp-i18n', 'jquery' ], time(), true );
				wp_enqueue_style( 'wp-synapse-ai-lite-style', $dist_url . 'index.css', [], time() );
			}
		}

		wp_localize_script( 'wp-synapse-ai-lite-app', 'wpSynapseAILite', [
			'root' => esc_url_raw( rest_url( 'wp-synapse-ai-lite/v1' ) ),
			'nonce' => wp_create_nonce( 'wp_rest' ),
			'assetsUrl' => WP_SYNAPSE_AI_LITE_URL . 'admin/src/assets',
		] );
	}
}
