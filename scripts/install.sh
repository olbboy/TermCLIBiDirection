#!/bin/bash
# BiDirection — One-command setup
# Usage: curl -fsSL https://raw.githubusercontent.com/dmdat/bidirection/main/scripts/install.sh | bash

set -e

REPO="https://github.com/dmdat/bidirection.git"
INSTALL_DIR="${BIDIRECTION_INSTALL_DIR:-$HOME/.bidirection}"
EXT_DIR="$INSTALL_DIR/packages/vscode-extension"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   BiDirection Installer              ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Check prerequisites
for cmd in node npm git; do
    if ! command -v $cmd &>/dev/null; then
        echo "❌ $cmd is required but not installed."
        exit 1
    fi
done

NODE_VER=$(node -v | cut -d. -f1 | tr -d v)
if [ "$NODE_VER" -lt 18 ]; then
    echo "❌ Node.js 18+ required (found: $(node -v))"
    exit 1
fi
echo "  ✅ Prerequisites: node $(node -v), npm $(npm -v)"

# Clone or update
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "  📦 Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull --quiet
else
    echo "  📦 Cloning repository..."
    git clone --quiet --depth 1 "$REPO" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies
echo "  📦 Installing dependencies..."
npm install --silent 2>/dev/null

# Build all packages
echo "  🔨 Building packages..."
npm run build:core --silent 2>/dev/null
npm run build:cli --silent 2>/dev/null

# Link CLI globally
echo "  🔗 Linking CLI globally..."
npm link -w packages/cli --silent 2>/dev/null

# Build extension
echo "  🧩 Building VS Code extension..."
npm run build -w packages/vscode-extension --silent 2>/dev/null

# Package VSIX
echo "  📦 Packaging extension..."
cd "$EXT_DIR"
npx -y @vscode/vsce package --no-dependencies 2>/dev/null
VSIX_FILE=$(ls -1 *.vsix 2>/dev/null | head -1)

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   ✅ Installation Complete!          ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  CLI:  bidirection --help  (or: bd --help)"
echo "  Test: bidirection ping"
echo ""

if [ -n "$VSIX_FILE" ]; then
    echo "  Extension: $EXT_DIR/$VSIX_FILE"
    echo ""
    echo "  Install in VS Code:"
    echo "    code --install-extension $EXT_DIR/$VSIX_FILE"
    echo ""
    echo "  Or in Antigravity:"
    echo "    Open Extensions → Install from VSIX → select $VSIX_FILE"
fi

echo ""
