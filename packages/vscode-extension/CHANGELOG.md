# Changelog

All notable changes to the BiDirection Bridge extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-23

### Added

- **Bridge Server** — Auto-starts Unix Domain Socket server on VS Code startup
- **JSON-RPC 2.0 Protocol** — Full bidirectional communication with 4-byte length-prefixed framing
- **Editor Handlers** — Read text, selection, cursor position; apply edits, highlight lines
- **Workspace Handlers** — Open files, get diagnostics, list open files
- **Terminal Handlers** — Create and manage integrated terminals
- **Window Handlers** — Show messages, execute commands, input boxes
- **Status Bar** — Real-time bridge status indicator with client count
- **Auto-Start** — Configurable automatic bridge startup via `bidirection.autoStart`
- **Custom Socket** — Configurable socket path via `bidirection.socketPath`

### Commands

- `BiDirection: Start Bridge Server` — Manually start the bridge
- `BiDirection: Stop Bridge Server` — Stop the bridge
- `BiDirection: Show Bridge Status` — View connection details
