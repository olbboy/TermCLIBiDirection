#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# BiDirection: Discover VS Code IPC Sockets
# ═══════════════════════════════════════════════════════════════════
# Scans for active VS Code Unix Domain Sockets on macOS/Linux.
# Usage: ./discover-sockets.sh [--json]

set -euo pipefail

TMPDIR_PATH="${TMPDIR:-/tmp}"

echo "🔍 Scanning for VS Code IPC sockets..."
echo ""

found=0

# Scan for vscode-ipc-*.sock files
for sock in "${TMPDIR_PATH}"/vscode-ipc-*.sock; do
    [ -S "$sock" ] || continue
    
    # Check if socket is still alive (has an active process)
    if lsof -U 2>/dev/null | grep -q "$(basename "$sock")"; then
        status="ACTIVE"
        color="\033[32m"  # green
    else
        status="STALE"
        color="\033[31m"  # red
    fi
    
    age=$(( ($(date +%s) - $(stat -f %m "$sock" 2>/dev/null || stat -c %Y "$sock" 2>/dev/null)) ))
    
    if [ "$1" = "--json" ] 2>/dev/null; then
        echo "{\"path\": \"$sock\", \"status\": \"$status\", \"age_seconds\": $age}"
    else
        echo -e "  ${color}● ${status}\033[0m  $sock"
        echo -e "    Age: ${age}s"
    fi
    
    found=$((found + 1))
done

# Also check BiDirection bridge socket
BRIDGE_SOCK="$HOME/.bidirection/bridge.sock"
if [ -S "$BRIDGE_SOCK" ]; then
    echo -e "  \033[36m● BRIDGE\033[0m  $BRIDGE_SOCK"
    found=$((found + 1))
fi

echo ""
if [ $found -eq 0 ]; then
    echo "⚠ No sockets found. Is VS Code running?"
else
    echo "Found $found socket(s)"
fi
