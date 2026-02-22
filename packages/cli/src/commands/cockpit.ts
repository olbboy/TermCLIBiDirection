/**
 * Cockpit Commands — Proxy Antigravity Cockpit extension commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { BridgeClient, Methods } from '@bidirection/core';

const DEFAULT_APP = 'Antigravity';

async function execCockpitCommand(command: string, socketPath?: string): Promise<boolean> {
    // Try bridge first
    try {
        const client = new BridgeClient(socketPath ? { socketPath } : {});
        await client.connect();
        try {
            await client.request(Methods.COMMAND_EXECUTE, { command });
            return true;
        } finally {
            client.disconnect();
        }
    } catch {
        // Fall back to AppleScript keyboard shortcut
        return false;
    }
}

function sendKeystroke(appName: string, key: string, modifiers: string): void {
    const script = `
        tell application "${appName}" to activate
        delay 0.3
        tell application "System Events"
            tell process "${appName}"
                keystroke "${key}" using {${modifiers}}
            end tell
        end tell
        return "ok"
    `;

    try {
        execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
            encoding: 'utf-8',
            timeout: 10000,
        });
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw error;
    }
}

export function registerCockpitCommands(program: Command): void {
    const cockpit = program
        .command('cockpit')
        .description('Control Antigravity Cockpit extension');

    // ─── cockpit open ─────────────────────────────────────────────
    cockpit
        .command('open')
        .description('Open the Antigravity Cockpit panel (Ctrl+Shift+Q)')
        .option('-a, --app <name>', 'Target IDE app', DEFAULT_APP)
        .option('-s, --socket <path>', 'Bridge socket path')
        .action(async (options) => {
            const appName = options.app || DEFAULT_APP;

            // Try bridge command first
            const bridgeSuccess = await execCockpitCommand('agCockpit.open', options.socket);
            if (bridgeSuccess) {
                console.log(chalk.green('✓ Cockpit opened via bridge'));
                process.exit(0);
            }

            // Fallback: Ctrl+Shift+Q
            if (process.platform !== 'darwin') {
                console.error(chalk.red('✗ Only supported on macOS'));
                process.exit(1);
            }

            try {
                sendKeystroke(appName, 'q', 'control down, shift down');
                console.log(chalk.green(`✓ Cockpit opened in ${appName}`));
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed: ${error.message}`));
                process.exit(1);
            }
            process.exit(0);
        });

    // ─── cockpit refresh ──────────────────────────────────────────
    cockpit
        .command('refresh')
        .description('Refresh Cockpit quota data (Ctrl+Shift+R)')
        .option('-a, --app <name>', 'Target IDE app', DEFAULT_APP)
        .option('-s, --socket <path>', 'Bridge socket path')
        .action(async (options) => {
            const appName = options.app || DEFAULT_APP;

            const bridgeSuccess = await execCockpitCommand('agCockpit.refresh', options.socket);
            if (bridgeSuccess) {
                console.log(chalk.green('✓ Cockpit refreshed via bridge'));
                process.exit(0);
            }

            if (process.platform !== 'darwin') {
                console.error(chalk.red('✗ Only supported on macOS'));
                process.exit(1);
            }

            try {
                sendKeystroke(appName, 'r', 'control down, shift down');
                console.log(chalk.green(`✓ Cockpit refreshed in ${appName}`));
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed: ${error.message}`));
                process.exit(1);
            }
            process.exit(0);
        });

    // ─── cockpit logs ─────────────────────────────────────────────
    cockpit
        .command('logs')
        .description('Show Cockpit logs (via bridge command)')
        .option('-s, --socket <path>', 'Bridge socket path')
        .action(async (options) => {
            const bridgeSuccess = await execCockpitCommand('agCockpit.showLogs', options.socket);
            if (bridgeSuccess) {
                console.log(chalk.green('✓ Cockpit logs opened'));
            } else {
                console.log(chalk.yellow('⚠ Could not open logs via bridge.'));
                console.log(chalk.dim('  Open Antigravity → Ctrl+Shift+Q → click "Show Logs"'));
            }
            process.exit(0);
        });
}
