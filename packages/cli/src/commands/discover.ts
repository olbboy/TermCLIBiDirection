/**
 * Discover Command (Tier 1)
 * 
 * Find active VS Code IPC sockets and BiDirection bridge sockets.
 * Optionally export VSCODE_IPC_HOOK_CLI for shell injection.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
    discoverAllSockets,
    scanForVSCodeSockets,
    findBridgeSocket,
    isSocketAlive,
    getIPCExportCommand,
    generateAutoInjectScript,
    DiscoveredSocket,
} from '@bidirection/core';

export function registerDiscoverCommand(program: Command): void {
    const discover = program
        .command('discover')
        .description('Scan for active IDE sockets (Tier 1: Socket Discovery)')
        .option('-a, --all', 'Show all sockets including inactive ones')
        .option('-j, --json', 'Output as JSON')
        .action(async (options) => {
            try {
                const sockets = await discoverAllSockets();
                const filtered = options.all ? sockets : sockets.filter((s) => s.active);

                if (options.json) {
                    console.log(JSON.stringify(filtered, null, 2));
                    return;
                }

                if (filtered.length === 0) {
                    console.log(chalk.yellow('⚠ No active IDE sockets found.'));
                    console.log(chalk.dim('  Make sure VS Code or Antigravity is running.'));
                    return;
                }

                console.log(chalk.bold.cyan('\n🔍 Discovered IDE Sockets:\n'));

                for (const sock of filtered) {
                    const typeLabel =
                        sock.type === 'bidirection-bridge'
                            ? chalk.green('BiDirection Bridge')
                            : chalk.blue('VS Code IPC');
                    const statusLabel = sock.active
                        ? chalk.green('● ACTIVE')
                        : chalk.red('○ INACTIVE');
                    const ageStr = formatAge(sock.age);

                    console.log(`  ${statusLabel}  ${typeLabel}`);
                    console.log(chalk.dim(`    Path: ${sock.path}`));
                    console.log(chalk.dim(`    Age:  ${ageStr}`));
                    console.log();
                }

                // Suggest injection for the best socket
                const bestVsc = filtered.find(
                    (s) => s.type === 'vscode-ipc' && s.active
                );
                if (bestVsc) {
                    console.log(chalk.bold('💉 To inject into your shell:'));
                    console.log(chalk.cyan(`  ${getIPCExportCommand(bestVsc.path)}`));
                    console.log();
                }
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`Error: ${error.message}`));
                process.exit(1);
            }
        });

    // Sub-command: inject
    program
        .command('inject')
        .description('Print shell export command for VSCODE_IPC_HOOK_CLI')
        .option('--auto', 'Generate auto-inject script for .zshrc/.bashrc')
        .action(async (options) => {
            if (options.auto) {
                console.log(generateAutoInjectScript());
                return;
            }

            const sockets = await discoverAllSockets();
            const vscSocket = sockets.find(
                (s) => s.type === 'vscode-ipc' && s.active
            );

            if (!vscSocket) {
                console.error(chalk.red('No active VS Code IPC socket found.'));
                process.exit(1);
            }

            // Output just the export command (for eval)
            console.log(getIPCExportCommand(vscSocket.path));
        });
}

function formatAge(ms: number): string {
    if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
}
