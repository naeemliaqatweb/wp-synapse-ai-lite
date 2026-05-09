# Packaging & Distribution Guide

To prepare **WP Synapse AI Lite** for sale or distribution on platforms like CodeCanyon or your own site, follow these steps to create a clean, professional ZIP file.

## 1. Prepare the Production Build
First, ensure the React application is built and optimized.
```bash
cd admin
npm run build
```

## 2. Recommended ZIP Structure
A professional WordPress plugin ZIP should only contain the files necessary for the plugin to run. Do **NOT** include `node_modules` or development config files.

### Standard Distribution (Recommended)
This version is lightweight and ready for users to install.
*   `wp-synapse-ai-lite/`
    *   `admin/dist/` (Crucial: Contains the built JS/CSS)
    *   `includes/` (All PHP classes)
    *   `wp-synapse-ai-lite.php` (Main plugin file)
    *   `README.md`
    *   `LICENSE.txt`

### Developer Edition (Optional)
If you are selling a "Developer Edition," you can include the `admin/src` folder, but still exclude `node_modules`.

## 3. Automated Packaging Script
I have created a helper script for you called `package-plugin.sh` in the plugin root. Run it to generate a clean ZIP automatically.

```bash
bash package-plugin.sh
```

## 4. Exclusion List (What to avoid)
Ensure these folders/files are **NOT** in your final ZIP:
*   ❌ `admin/node_modules/` (Very large, will break the upload)
*   ❌ `.git/` or `.gitignore`
*   ❌ `package-lock.json`
*   ❌ `vite.config.js`
*   ❌ Any `.DS_Store` or system files

---
**Tip:** Always test the generated ZIP by installing it on a fresh WordPress site before uploading it to your sales platform!
