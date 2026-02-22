# BiDirection — Agent Instructions

> This file is read by Antigravity and other AI coding agents. It provides project-specific context, conventions, and actionable commands.

## Project Identity

- **Name**: BiDirection
- **Purpose**: Terminal ↔ IDE bidirectional communication bridge via Unix Domain Socket + JSON-RPC 2.0
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 18+
- **License**: MIT
- **Package Manager**: npm workspaces (monorepo)

## Monorepo Structure

```
packages/
├── core/           # Shared library — protocol types, client, framing, Antigravity utilities
├── cli/            # Terminal CLI — 41 commands across 10 groups
└── vscode-extension/  # VS Code/Antigravity extension — bridge server + handlers
```

### Package Dependencies

```
core ← cli           (CLI imports from core)
core ← vscode-extension  (Extension imports from core)
```

**Always build `core` first** when modifying shared types or utilities.

## Build Commands

```bash
# Build order matters — core must build before consumers
npm run build:core         # Build core first
npm run build:cli          # Then CLI
npm run build:ext          # Then extension (uses esbuild)
npm run build              # Or build all at once (respects workspace order)
```

## Test Command

```bash
node scripts/test-e2e.js   # 31 E2E integration tests (must pass before any PR)
```

## Key Files to Understand

| File | Purpose | When to Read |
|------|---------|-------------|
| `packages/core/src/protocol.ts` | JSON-RPC method definitions, error codes, all TypeScript types | When adding/modifying bridge communication |
| `packages/core/src/client.ts` | `BridgeClient` class — socket connection logic | When working on CLI-to-extension communication |
| `packages/core/src/framing.ts` | 4-byte length-prefixed message framing | When debugging protocol issues |
| `packages/core/src/antigravity.ts` | Brain, knowledge, conversation filesystem utilities | When adding Antigravity features |
| `packages/core/src/workflows.ts` | Workflow/skill discovery and YAML frontmatter parsing | When modifying workflow commands |
| `packages/cli/src/index.ts` | CLI entry point — all command group registrations | When adding new command groups |
| `packages/vscode-extension/src/extension.ts` | Extension activation, commands, status bar | When modifying extension behavior |
| `packages/vscode-extension/src/server.ts` | Unix Domain Socket server with JSON-RPC dispatch | When adding new server methods |

## How to Add a New CLI Command

1. Create `packages/cli/src/commands/<name>.ts`
2. Export: `export function register<Name>Commands(program: Command): void`
3. Use `commander` for argument parsing, `chalk` for terminal styling
4. Import and register in `packages/cli/src/index.ts`
5. Build: `npm run build:cli`
6. Test: `node packages/cli/dist/index.js <name> --help`

### Command Template

```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function registerExampleCommands(program: Command): void {
    const example = program
        .command('example')
        .description('Description here');

    example
        .command('list')
        .description('List items')
        .action(() => {
            console.log(chalk.bold.cyan('\n📋 Items:\n'));
            // implementation
            process.exit(0);
        });
}
```

## How to Add a New JSON-RPC Method

1. Add method constant to `packages/core/src/protocol.ts` in the `Methods` object
2. Add handler in `packages/vscode-extension/src/handlers/<category>.ts`
3. Register handler in `packages/vscode-extension/src/server.ts` or `extension.ts`
4. Add corresponding CLI command in `packages/cli/src/commands/bridge.ts`
5. Build all: `npm run build`

## Coding Conventions

- **Error handling**: Always catch errors and show user-friendly messages with `chalk.red('✗ ...')`
- **Exit codes**: Use `process.exit(0)` for success, `process.exit(1)` for errors
- **TypeScript**: Strict mode, `unknown` for catch blocks (not `any`), explicit type annotations on function signatures
- **Formatting**: 4-space indentation, single quotes, trailing commas in multiline
- **Imports**: Node builtins first, then packages, then local modules
- **Output styling**: Use chalk for colored output. Header in `chalk.bold.cyan()`, success in `chalk.green('✓')`, errors in `chalk.red('✗')`
- **AppleScript**: All macOS-specific code must check `process.platform === 'darwin'`

## Antigravity Integration Points

BiDirection reads from these Antigravity filesystem locations:

| Path | Format | BiDirection Command |
|------|--------|-------------------|
| `~/.gemini/antigravity/brain/` | Markdown artifacts | `brain list/show/task/logs/read` |
| `~/.gemini/antigravity/knowledge/` | JSON metadata + markdown | `ki list/show/search` |
| `~/.gemini/antigravity/conversations/` | Protobuf (.pb) | `conv list` |
| `~/.gemini/antigravity/code_tracker/active/` | File snapshots | `tracker list/files/diff` |
| `~/.gemini/antigravity/mcp_config.json` | JSON | `mcp list/show/add/remove` |
| `~/.gemini/antigravity/browser_recordings/` | Recording files | `conv recordings` |
| `~/.gemini/antigravity/browserAllowlist.txt` | Newline-separated domains | `system browser-allow/deny` |
| `~/.gemini/antigravity/installation_id` | UUID text | `system info` |

## Package Versioning

All three packages share version `1.0.0`. When bumping:
1. Update `packages/core/package.json` version
2. Update `packages/cli/package.json` version + core dependency
3. Update `packages/vscode-extension/package.json` version + core dependency
4. Update root `package.json` if needed

## Extension Packaging

```bash
cd packages/vscode-extension
npm run package    # Produces bidirection-bridge-<version>.vsix
```

This runs `vscode:prepublish` → esbuild minify → `vsce package`. Output is a single bundled file (~30KB .vsix).
