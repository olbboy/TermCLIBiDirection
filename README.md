# BiDirection

**Terminal-to-IDE Bidirectional Communication Bridge**

A 3-tier system that enables deep, programmatic interaction between external terminals (iTerm2, Alacritty, etc.) and modern IDEs (VS Code, Antigravity).

## Architecture

```
┌──────────────────┐    Unix Domain Socket    ┌──────────────────────┐
│   External       │ ◀══════════════════════▶ │   VS Code / IDE      │
│   Terminal       │    JSON-RPC 2.0          │                      │
│                  │                          │  ┌────────────────┐  │
│  bidirection CLI │ ────────────────────────▶│  │ BiDirection    │  │
│                  │  ~/.bidirection/         │  │ Extension      │  │
│                  │      bridge.sock         │  │                │  │
│  • read code     │                          │  │ • Socket Server│  │
│  • apply edits   │                          │  │ • Editor APIs  │  │
│  • highlight     │                          │  │ • Workspace    │  │
│  • diagnostics   │                          │  │ • Commands     │  │
│  • execute cmds  │                          │  └────────────────┘  │
└──────────────────┘                          └──────────────────────┘
```

## 3 Tiers

### Tier 1: Socket Discovery & Environment Spoofing
Finds active VS Code IPC sockets and injects `VSCODE_IPC_HOOK_CLI` into your shell so `code` commands route to the existing window.

```bash
# Discover sockets
bidirection discover

# Inject into shell (for eval)
eval $(bidirection inject)

# Or add auto-inject to .zshrc
bidirection inject --auto >> ~/.zshrc
```

### Tier 2: Extension Bridge (Core)
A VS Code Extension creates a Unix Socket server with JSON-RPC protocol, enabling full bidirectional IDE control.

```bash
# Check bridge status
bidirection ping
bidirection info

# Read active editor
bidirection read
bidirection read --selection

# Open file at specific line
bidirection open src/main.ts --line 42

# Highlight lines
bidirection highlight src/main.ts 10 --end-line 20

# Apply edits
bidirection edit src/main.ts --start-line 9 --start-char 0 --end-line 9 --end-char 30 --text "new code here"

# Get diagnostics
bidirection diagnostics
bidirection diag src/main.ts

# List open files
bidirection files

# Execute VS Code commands
bidirection exec editor.action.formatDocument
bidirection exec workbench.action.toggleSidebarVisibility

# Show message in IDE
bidirection message "Build complete!" --type info

# Watch for real-time events
bidirection watch
```

### Tier 3: OS-Level Fallback
Works without any extension — uses macOS URL Schemes, AppleScript, and Accessibility APIs.

```bash
# Open file via URL scheme
bidirection os open src/main.ts --line 15

# Dump UI accessibility tree
bidirection os ui-tree "Code"
bidirection os ui-tree "Antigravity" --depth 5

# Send keystrokes (e.g., Cmd+S to save)
bidirection os keystroke "s" --modifier command --app "Code"

# Bring IDE to front
bidirection os activate "Code"
```

## Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Install CLI globally
cd packages/cli && npm link
```

### VS Code Extension
1. Build the extension: `cd packages/vscode-extension && npm run build`
2. Package: `cd packages/vscode-extension && npm run package`
3. Install the `.vsix` file in VS Code

The extension auto-starts the bridge server. You'll see a **$(plug) BiDirection** indicator in the status bar.

## Protocol

All communication uses **JSON-RPC 2.0** over Unix Domain Socket with 4-byte length-prefixed framing.

```json
// Request (Terminal → IDE)
{ "jsonrpc": "2.0", "id": 1, "method": "editor/getText", "params": {} }

// Response (IDE → Terminal)
{ "jsonrpc": "2.0", "id": 1, "result": { "text": "...", "uri": "/path/to/file.ts" } }
```

## License

MIT
