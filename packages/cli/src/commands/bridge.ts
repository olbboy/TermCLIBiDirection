/**
 * Bridge Commands (Tier 2)
 * 
 * Commands that communicate through the BiDirection bridge extension
 * via Unix Domain Socket using JSON-RPC protocol.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import {
    BridgeClient,
    Methods,
    GetTextResult,
    GetSelectionResult,
    GetDiagnosticsResult,
    GetOpenFilesResult,
    GetInfoResult,
    PingResult,
    ApplyEditResult,
    HighlightResult,
    OpenFileResult,
    ShowMessageResult,
    ExecuteCommandResult,
} from '@bidirection/core';

/**
 * Run a one-shot CLI command with a BridgeClient.
 * Handles connect → execute → disconnect → process.exit(0) lifecycle.
 * Without process.exit(), dangling socket listeners keep the Node.js event loop alive.
 */
async function runWithClient<T>(
    socketPath: string | undefined,
    fn: (client: BridgeClient) => Promise<T>
): Promise<T> {
    const client = new BridgeClient(socketPath ? { socketPath } : {});
    try {
        await client.connect();
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(chalk.red(`✗ Cannot connect to BiDirection bridge.`));
        console.error(chalk.dim(`  ${error.message}`));
        console.error(chalk.dim(`  Make sure the BiDirection extension is running in VS Code.`));
        process.exit(1);
    }
    try {
        const result = await fn(client);
        return result;
    } finally {
        client.disconnect();
        setImmediate(() => process.exit(0));
    }
}

/**
 * Get a BridgeClient for long-running commands (like watch) that manage their own lifecycle.
 */
async function getClient(socketPath?: string): Promise<BridgeClient> {
    const client = new BridgeClient(socketPath ? { socketPath } : {});
    try {
        await client.connect();
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(chalk.red(`✗ Cannot connect to BiDirection bridge.`));
        console.error(chalk.dim(`  ${error.message}`));
        console.error(chalk.dim(`  Make sure the BiDirection extension is running in VS Code.`));
        process.exit(1);
    }
    return client;
}

export function registerBridgeCommands(program: Command): void {
    // ─── info ───────────────────────────────────────────────────────────
    program
        .command('info')
        .description('Get bridge server information')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (options) => {
            await runWithClient(options.socket, async (client) => {
                const info = await client.request<GetInfoResult>(Methods.GET_INFO);
                console.log(chalk.bold.cyan('\n📡 BiDirection Bridge Info:\n'));
                console.log(`  IDE:          ${chalk.green(info.ide)} ${info.ideVersion}`);
                console.log(`  Bridge:       v${info.version}`);
                console.log(`  Socket:       ${chalk.dim(info.socketPath)}`);
                console.log(`  PID:          ${info.pid}`);
                console.log(`  Workspaces:   ${info.workspaceFolders.join(', ') || chalk.dim('none')}`);
                console.log();
            });
        });

    // ─── ping ───────────────────────────────────────────────────────────
    program
        .command('ping')
        .description('Ping the bridge server')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (options) => {
            const start = Date.now();
            await runWithClient(options.socket, async (client) => {
                const result = await client.request<PingResult>(Methods.PING);
                const elapsed = Date.now() - start;
                console.log(chalk.green(`✓ pong (${elapsed}ms) v${result.version}`));
            });
        });

    // ─── read ───────────────────────────────────────────────────────────
    program
        .command('read')
        .description('Read content of the active editor or a specific file')
        .argument('[file]', 'File path (optional, defaults to active editor)')
        .option('-s, --socket <path>', 'Custom socket path')
        .option('-j, --json', 'Output as JSON')
        .option('--selection', 'Read only the current selection')
        .action(async (file, options) => {
            await runWithClient(options.socket, async (client) => {
                if (options.selection) {
                    const result = await client.request<GetSelectionResult>(
                        Methods.EDITOR_GET_SELECTION,
                        file ? { uri: path.resolve(file) } : {}
                    );
                    if (options.json) {
                        console.log(JSON.stringify(result, null, 2));
                    } else {
                        console.log(chalk.dim(`# Selection: ${result.uri} [${result.startLine}:${result.startCharacter} → ${result.endLine}:${result.endCharacter}]`));
                        console.log(result.text);
                    }
                } else {
                    const result = await client.request<GetTextResult>(
                        Methods.EDITOR_GET_TEXT,
                        file ? { uri: path.resolve(file) } : {}
                    );
                    if (options.json) {
                        console.log(JSON.stringify(result, null, 2));
                    } else {
                        console.log(chalk.dim(`# ${result.uri} (${result.languageId}, ${result.lineCount} lines)`));
                        console.log(result.text);
                    }
                }
            });
        });

    // ─── open ───────────────────────────────────────────────────────────
    program
        .command('open')
        .description('Open a file in the IDE')
        .argument('<file>', 'File path to open')
        .option('-l, --line <number>', 'Go to line number', parseInt)
        .option('-c, --character <number>', 'Go to character', parseInt)
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (file, options) => {
            await runWithClient(options.socket, async (client) => {
                await client.request<OpenFileResult>(
                    Methods.WORKSPACE_OPEN_FILE,
                    {
                        uri: path.resolve(file),
                        line: options.line,
                        character: options.character,
                    }
                );
                console.log(chalk.green(`✓ Opened ${path.basename(file)}${options.line ? ` at line ${options.line}` : ''}`));
            });
        });

    // ─── edit ───────────────────────────────────────────────────────────
    program
        .command('edit')
        .description('Apply an edit to a file in the IDE')
        .argument('<file>', 'File path')
        .requiredOption('--start-line <n>', 'Start line (0-indexed)', parseInt)
        .requiredOption('--start-char <n>', 'Start character', parseInt)
        .requiredOption('--end-line <n>', 'End line (0-indexed)', parseInt)
        .requiredOption('--end-char <n>', 'End character', parseInt)
        .requiredOption('--text <text>', 'Replacement text')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (file, options) => {
            await runWithClient(options.socket, async (client) => {
                await client.request<ApplyEditResult>(
                    Methods.EDITOR_APPLY_EDIT,
                    {
                        uri: path.resolve(file),
                        edits: [{
                            startLine: options.startLine,
                            startCharacter: options.startChar,
                            endLine: options.endLine,
                            endCharacter: options.endChar,
                            newText: options.text,
                        }],
                    }
                );
                console.log(chalk.green(`✓ Edit applied to ${path.basename(file)}`));
            });
        });

    // ─── highlight ──────────────────────────────────────────────────────
    program
        .command('highlight')
        .description('Highlight lines in the IDE editor')
        .argument('<file>', 'File path')
        .argument('<line>', 'Line number to highlight (0-indexed)', parseInt)
        .option('--end-line <n>', 'End line for range highlight', parseInt)
        .option('--color <color>', 'Highlight color (CSS)', 'rgba(255, 255, 0, 0.3)')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (file, line, options) => {
            await runWithClient(options.socket, async (client) => {
                const endLine = options.endLine ?? line;
                await client.request<HighlightResult>(
                    Methods.EDITOR_HIGHLIGHT,
                    {
                        uri: path.resolve(file),
                        startLine: line,
                        endLine,
                        color: options.color,
                    }
                );
                console.log(chalk.green(
                    `✓ Highlighted ${path.basename(file)} lines ${line}${endLine !== line ? `-${endLine}` : ''}`
                ));
            });
        });

    // ─── diagnostics ───────────────────────────────────────────────────
    program
        .command('diagnostics')
        .alias('diag')
        .description('Get diagnostics (errors, warnings) from the IDE')
        .argument('[file]', 'Filter by file path')
        .option('-s, --socket <path>', 'Custom socket path')
        .option('-j, --json', 'Output as JSON')
        .action(async (file, options) => {
            await runWithClient(options.socket, async (client) => {
                const result = await client.request<GetDiagnosticsResult>(
                    Methods.WORKSPACE_GET_DIAGNOSTICS,
                    file ? { uri: path.resolve(file) } : {}
                );

                if (options.json) {
                    console.log(JSON.stringify(result, null, 2));
                    return;
                }

                if (result.diagnostics.length === 0) {
                    console.log(chalk.green('✓ No diagnostics'));
                    return;
                }

                console.log(chalk.bold(`\n📋 Diagnostics (${result.diagnostics.length}):\n`));
                for (const d of result.diagnostics) {
                    const icon = d.severity === 'error' ? chalk.red('✗') :
                        d.severity === 'warning' ? chalk.yellow('⚠') :
                            chalk.blue('ℹ');
                    console.log(`  ${icon} ${path.basename(d.uri)}:${d.line + 1}:${d.character + 1}`);
                    console.log(chalk.dim(`    ${d.message}`));
                    if (d.source) console.log(chalk.dim(`    Source: ${d.source}`));
                }
                console.log();
            });
        });

    // ─── files ──────────────────────────────────────────────────────────
    program
        .command('files')
        .description('List all open files in the IDE')
        .option('-s, --socket <path>', 'Custom socket path')
        .option('-j, --json', 'Output as JSON')
        .action(async (options) => {
            await runWithClient(options.socket, async (client) => {
                const result = await client.request<GetOpenFilesResult>(
                    Methods.WORKSPACE_GET_OPEN_FILES
                );

                if (options.json) {
                    console.log(JSON.stringify(result, null, 2));
                    return;
                }

                console.log(chalk.bold(`\n📂 Open Files (${result.files.length}):\n`));
                for (const f of result.files) {
                    const activeIcon = f.isActive ? chalk.green('▸') : ' ';
                    const dirtyIcon = f.isDirty ? chalk.yellow('●') : ' ';
                    console.log(`  ${activeIcon}${dirtyIcon} ${path.basename(f.uri)} ${chalk.dim(`(${f.languageId})`)}`);
                    console.log(chalk.dim(`     ${f.uri}`));
                }
                console.log();
            });
        });

    // ─── exec ───────────────────────────────────────────────────────────
    program
        .command('exec')
        .description('Execute a VS Code command')
        .argument('<command>', 'VS Code command ID (e.g., editor.action.formatDocument)')
        .option('-a, --args <args>', 'JSON arguments', '[]')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (command, options) => {
            await runWithClient(options.socket, async (client) => {
                let args: unknown[] = [];
                try {
                    args = JSON.parse(options.args);
                } catch {
                    console.error(chalk.red('Invalid JSON for --args'));
                    process.exit(1);
                }

                const result = await client.request<ExecuteCommandResult>(
                    Methods.COMMAND_EXECUTE,
                    { command, args }
                );
                console.log(chalk.green(`✓ Executed: ${command}`));
                if (result.result !== undefined) {
                    console.log(chalk.dim(JSON.stringify(result.result, null, 2)));
                }
            });
        });

    // ─── message ────────────────────────────────────────────────────────
    program
        .command('message')
        .alias('msg')
        .description('Show a message in the IDE')
        .argument('<text>', 'Message text')
        .option('-t, --type <type>', 'Message type: info, warning, error', 'info')
        .option('-a, --actions <actions...>', 'Action buttons')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (text, options) => {
            await runWithClient(options.socket, async (client) => {
                const result = await client.request<ShowMessageResult>(
                    Methods.WINDOW_SHOW_MESSAGE,
                    {
                        message: text,
                        type: options.type,
                        actions: options.actions,
                    }
                );
                if (result.selectedAction) {
                    console.log(chalk.green(`User selected: ${result.selectedAction}`));
                }
            });
        });

    // ─── watch ──────────────────────────────────────────────────────────
    // NOTE: watch uses getClient() instead of runWithClient() because it's long-running
    program
        .command('watch')
        .description('Watch for editor change events (streaming)')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (options) => {
            const client = await getClient(options.socket);

            console.log(chalk.bold.cyan('👁 Watching for editor events... (Ctrl+C to stop)\n'));

            client.onNotification(Methods.EDITOR_ON_CHANGE, (params: any) => {
                console.log(chalk.yellow(`[CHANGE] ${path.basename(params.uri)} (${params.changes?.length || 0} changes)`));
            });

            client.onNotification(Methods.EDITOR_ON_SAVE, (params: any) => {
                console.log(chalk.green(`[SAVE]   ${path.basename(params.uri)}`));
            });

            client.onNotification(Methods.EDITOR_ON_ACTIVE_CHANGE, (params: any) => {
                console.log(chalk.blue(`[FOCUS]  ${path.basename(params.uri)} (${params.languageId})`));
            });

            // Keep alive
            process.on('SIGINT', () => {
                console.log(chalk.dim('\nStopping watch...'));
                client.disconnect();
                process.exit(0);
            });
        });
}
