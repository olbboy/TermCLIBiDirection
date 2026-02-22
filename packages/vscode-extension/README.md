# BiDirection Bridge

> 🔌 Terminal-to-IDE bidirectional communication via Unix Domain Socket + JSON-RPC 2.0

**BiDirection Bridge** creates a real-time communication channel between your external terminal and VS Code. Run commands from iTerm2, Alacritty, or any terminal — read files, apply edits, get diagnostics, highlight lines, and control your IDE programmatically.

## Features

- **🚀 Auto-Start** — Bridge server starts automatically on VS Code launch
- **📡 JSON-RPC 2.0** — Industry-standard protocol over Unix Domain Socket
- **📝 Editor Control** — Read/write text, selections, cursor position, highlights
- **🔍 Diagnostics** — Stream errors and warnings from the IDE
- **📂 Workspace** — Open files, list editors, execute commands
- **💻 Terminal** — Create and manage integrated terminals
- **🪟 Window** — Show messages, input boxes, quick picks
- **📊 Status Bar** — Real-time connection status with client count

## Quick Start

1. Install the extension
2. The bridge starts automatically — look for **$(plug) BiDirection** in the status bar
3. Install the CLI: `npm install -g @bidirection/cli`
4. Test: `bidirection ping`

## Commands

| Command | Description |
|---|---|
| `BiDirection: Start Bridge Server` | Manually start the bridge |
| `BiDirection: Stop Bridge Server` | Stop the bridge |
| `BiDirection: Show Bridge Status` | View connection details |

## Configuration

| Setting | Default | Description |
|---|---|---|
| `bidirection.autoStart` | `true` | Auto-start bridge on VS Code startup |
| `bidirection.socketPath` | `""` | Custom socket path (default: `~/.bidirection/bridge.sock`) |

## CLI Commands

Once the bridge is running, use the CLI from any terminal:

```bash
bidirection ping                     # Test connection
bidirection read                     # Read active editor content
bidirection read --selection         # Read selected text
bidirection open src/main.ts -l 42   # Open file at line
bidirection highlight src/main.ts 10 # Highlight line
bidirection diagnostics              # Get errors/warnings
bidirection files                    # List open files
bidirection exec editor.action.formatDocument  # Execute VS Code command
```

## Architecture

```
External Terminal ◀══ Unix Socket ══▶ VS Code Extension
    bidirection CLI     JSON-RPC 2.0      BiDirection Bridge
```

## Requirements

- VS Code 1.85.0+
- macOS, Linux, or WSL (Unix Domain Socket support)
- [BiDirection CLI](https://github.com/dmdat/bidirection) (`npm install -g @bidirection/cli`)

## License

[MIT](LICENSE)
