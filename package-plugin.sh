#!/bin/bash

# WP Synapse AI Lite - Packaging Script
# This script creates a clean ZIP for distribution

PLUGIN_NAME="wp-synapse-ai-lite"
VERSION="1.0.1"
ZIP_FILE="${PLUGIN_NAME}-v${VERSION}.zip"

echo "🚀 Starting packaging process for ${PLUGIN_NAME} v${VERSION}..."

# 1. Clean up previous builds
rm -f ${ZIP_FILE}

# 2. Ensure React is built
echo "📦 Building React application..."
cd admin
npm run build
cd ..

# 3. Create a temporary directory for the ZIP
echo "📁 Creating temporary structure..."
TEMP_DIR="tmp_package"
mkdir -p ${TEMP_DIR}/${PLUGIN_NAME}

# 4. Copy only necessary files
echo "📂 Copying production files..."
cp -r includes ${TEMP_DIR}/${PLUGIN_NAME}/
cp -r vendor ${TEMP_DIR}/${PLUGIN_NAME}/
mkdir -p ${TEMP_DIR}/${PLUGIN_NAME}/admin
cp -r admin/dist ${TEMP_DIR}/${PLUGIN_NAME}/admin/

cp wp-synapse-ai-lite.php ${TEMP_DIR}/${PLUGIN_NAME}/
cp README.md ${TEMP_DIR}/${PLUGIN_NAME}/
cp PRODUCT_DETAILS.md ${TEMP_DIR}/${PLUGIN_NAME}/
cp PACKAGING_GUIDE.md ${TEMP_DIR}/${PLUGIN_NAME}/
cp LICENSE.txt ${TEMP_DIR}/${PLUGIN_NAME}/

# 5. Create the ZIP
echo "🗜️  Zipping files..."
cd ${TEMP_DIR}
zip -r ../${ZIP_FILE} ${PLUGIN_NAME} -x "*.DS_Store*" "*node_modules*" "*.git*"
cd ..

# 6. Cleanup
echo "🧹 Cleaning up..."
rm -rf ${TEMP_DIR}

echo "✅ Success! Your distribution ZIP is ready: ${ZIP_FILE}"
echo "📝 Note: You can now upload this file to your sales platform."
