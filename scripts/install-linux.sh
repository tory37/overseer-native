#!/bin/bash

# Overseer Installation Script for Ubuntu / Pop!_OS
# This script downloads the latest AppImage, places it in ~/.local/bin,
# and creates a desktop entry for system-wide search.

set -e

REPO="tory37/overseer-native"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"
APP_NAME="Overseer"
BINARY_NAME="overseer"

echo "🚀 Starting Overseer installation..."

# Ensure directories exist
mkdir -p "$INSTALL_DIR"
mkdir -p "$DESKTOP_DIR"

# Fetch latest release info from GitHub API
echo "🔍 Fetching latest release info from $REPO..."
# Using python3 if available for more robust JSON parsing, fallback to grep/sed
if command -v python3 >/dev/null 2>&1; then
    DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | python3 -c "import sys, json; print(next(asset['browser_download_url'] for asset in json.load(sys.stdin)['assets'] if asset['name'].endswith('.AppImage')))")
else
    DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep -oP '"browser_download_url":\s*"\K[^"]+AppImage' | head -n 1)
fi

if [ -z "$DOWNLOAD_URL" ]; then
    echo "❌ Error: Could not find an AppImage in the latest release assets."
    exit 1
fi

# Download the AppImage
TARGET_PATH="$INSTALL_DIR/$APP_NAME.AppImage"
echo "📥 Downloading latest build..."
echo "Source: $DOWNLOAD_URL"
echo "Target: $TARGET_PATH"
curl -L "$DOWNLOAD_URL" -o "$TARGET_PATH"

# Make it executable
echo "⚙️ Making AppImage executable..."
chmod +x "$TARGET_PATH"

# Create symlink for terminal access
echo "🔗 Creating symlink in $INSTALL_DIR/$BINARY_NAME..."
ln -sf "$TARGET_PATH" "$INSTALL_DIR/$BINARY_NAME"

# Create .desktop file for system search
echo "🖥️ Creating desktop entry..."
cat > "$DESKTOP_DIR/overseer.desktop" <<EOF
[Desktop Entry]
Name=Overseer
Exec=$TARGET_PATH %U
Terminal=false
Type=Application
Icon=utilities-terminal
Categories=Development;
Comment=AI-assisted terminal manager
EOF

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR"
fi

echo "✅ Installation complete!"
echo ""
echo "You can now run 'overseer' from your terminal."
echo "Overseer should also appear in your application search/launcher."
echo ""

# Check if INSTALL_DIR is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "⚠️  Note: $INSTALL_DIR is not in your PATH."
    echo "To run 'overseer' from any terminal, add this to your .bashrc or .zshrc:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "You can also run it directly using: $TARGET_PATH"
fi
