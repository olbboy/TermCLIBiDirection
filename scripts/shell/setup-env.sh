#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# BiDirection: Setup Environment (Inject VSCODE_IPC_HOOK_CLI)
# ═══════════════════════════════════════════════════════════════════
# Source this file to inject the IPC hook into your shell:
#   source scripts/shell/setup-env.sh
# 
# Or add to ~/.zshrc:
#   source /path/to/BiDirection/scripts/shell/setup-env.sh

TMPDIR_PATH="${TMPDIR:-/tmp}"

# Find the most recent active VS Code IPC socket
_bidirection_find_socket() {
    local sock
    # Get newest socket file
    sock=$(ls -t "${TMPDIR_PATH}"/vscode-ipc-*.sock 2>/dev/null | head -1)
    
    if [ -n "$sock" ] && [ -S "$sock" ]; then
        echo "$sock"
    fi
}

# Auto-inject on source
_sock=$(_bidirection_find_socket)
if [ -n "$_sock" ]; then
    export VSCODE_IPC_HOOK_CLI="$_sock"
    echo "✓ VSCODE_IPC_HOOK_CLI set to: $_sock"
else
    echo "⚠ No active VS Code IPC socket found"
fi
unset _sock

# Helper function to re-inject (call manually if VS Code restarts)
bidirection-reinject() {
    local sock
    sock=$(_bidirection_find_socket)
    if [ -n "$sock" ]; then
        export VSCODE_IPC_HOOK_CLI="$sock"
        echo "✓ Re-injected: $sock"
    else
        echo "⚠ No active socket found"
    fi
}
