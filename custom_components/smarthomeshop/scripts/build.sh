#!/bin/bash
# Build script for SmartHomeShop integration
# Builds both frontend and panel, copies output to www/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building SmartHomeShop integration..."
echo "Version: $(grep '"version"' "$ROOT_DIR/manifest.json" | cut -d'"' -f4)"
echo ""

# Create www folder if it doesn't exist
mkdir -p "$ROOT_DIR/www"

# Build frontend
echo "Building frontend..."
cd "$ROOT_DIR/frontend"
npm run build
cp dist/smarthomeshop-cards.js "$ROOT_DIR/www/"
echo "Frontend build complete."
echo ""

# Build panel
echo "Building panel..."
cd "$ROOT_DIR/panel"
npm run build
cp dist/smarthomeshop-panel.js "$ROOT_DIR/www/"
echo "Panel build complete."
echo ""

echo "Build complete! Output files:"
ls -lh "$ROOT_DIR/www/"
