/**
 * Agent Commands
 * 
 * Send text to the IDE's AI agent panel from the terminal.
 * Uses a multi-strategy approach:
 *   1. Tier 2: VS Code command execution (if bridge is available)
 *   2. Tier 3: JXA/AppleScript clipboard + keystroke simulation (macOS)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { BridgeClient, Methods } from '@bidirection/core';

// ─── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_APP = 'Antigravity';
const DEFAULT_FOCUS_KEY = 'l';  // Cmd+L to focus agent panel
const DEFAULT_SUBMIT = 'enter';

// Known IDE app names and their agent panel focus shortcuts
const IDE_PRESETS: Record<string, { focusKey: string; submit: string }> = {
    'Antigravity': { focusKey: 'l', submit: 'enter' },
    'Code': { focusKey: 'l', submit: 'enter' },
    'Visual Studio Code': { focusKey: 'l', submit: 'enter' },
    'Cursor': { focusKey: 'l', submit: 'enter' },
    'Code - Insiders': { focusKey: 'l', submit: 'enter' },
    'Windsurf': { focusKey: 'l', submit: 'enter' },
};

// ─── Strategy: AppleScript/JXA (Tier 3) ──────────────────────────────

function sendViaAppleScript(
    text: string,
    appName: string,
    focusKey: string,
    submitMethod: string,
): void {
    // Build AppleScript that:
    // 1. Sets clipboard
    // 2. Activates app
    // 3. Focuses agent panel (Cmd+focusKey)
    // 4. Selects all existing text (Cmd+A)
    // 5. Pastes (Cmd+V)
    // 6. Submits (Enter or Cmd+Enter)

    // Escape text for AppleScript string literal
    const escapedText = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');

    // Parse focus key for modifiers
    let focusKeystroke: string;
    if (focusKey.includes('+')) {
        const parts = focusKey.toLowerCase().split('+');
        const key = parts.pop()!;
        const modifiers = parts.map(m => {
            switch (m) {
                case 'shift': return 'shift down';
                case 'option': case 'alt': return 'option down';
                case 'control': case 'ctrl': return 'control down';
                case 'command': case 'cmd': return 'command down';
                default: return m + ' down';
            }
        }).join(', ');
        focusKeystroke = `keystroke "${key}" using {${modifiers}}`;
    } else {
        focusKeystroke = `keystroke "${focusKey}" using {command down}`;
    }

    const submitKeystroke = submitMethod === 'cmd+enter'
        ? 'keystroke return using {command down}'
        : 'keystroke return';

    const script = `
        set the clipboard to "${escapedText}"
        
        tell application "${appName}"
            activate
        end tell
        
        delay 0.5
        
        tell application "System Events"
            tell process "${appName}"
                -- Focus the agent/chat panel
                ${focusKeystroke}
                delay 0.5
                
                -- Select all existing text in the input
                keystroke "a" using {command down}
                delay 0.1
                
                -- Paste our text
                keystroke "v" using {command down}
                delay 0.3
                
                -- Submit
                ${submitKeystroke}
            end tell
        end tell
        
        return "ok"
    `;

    try {
        execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
            encoding: 'utf-8',
            timeout: 15000,
        });
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (error.message.includes('not allowed assistive access')) {
            console.error(chalk.red('✗ Accessibility permission required'));
            console.error(chalk.dim('  System Preferences → Privacy & Security → Accessibility'));
            console.error(chalk.dim('  Add your terminal app (iTerm2, Terminal, etc.)'));
            process.exit(1);
        }

        throw error;
    }
}

// ─── Strategy: Bridge Command (Tier 2) ───────────────────────────────

async function sendViaBridge(
    text: string,
    socketPath?: string,
): Promise<boolean> {
    try {
        const client = new BridgeClient(socketPath ? { socketPath } : {});
        await client.connect();

        try {
            // Strategy A: Try inserting into chat input via command
            // These are common VS Code chat commands across forks
            const chatCommands = [
                'workbench.action.chat.open',
                'workbench.action.chat.newChat',
                'aichat.newchat',
            ];

            for (const cmd of chatCommands) {
                try {
                    await client.request(Methods.COMMAND_EXECUTE, {
                        command: cmd,
                        args: [text],
                    });
                    return true;
                } catch {
                    // Command not found, try next
                }
            }

            // Strategy B: Send to integrated terminal as fallback
            // The agent can read terminal output
            await client.request(Methods.TERMINAL_SEND_TEXT, {
                text: `# Agent Request: ${text}`,
            });
            return true;
        } finally {
            client.disconnect();
        }
    } catch {
        return false;
    }
}

// ─── Detect Running IDE ──────────────────────────────────────────────

function detectRunningIDE(): string | null {
    const names = Object.keys(IDE_PRESETS);
    for (const name of names) {
        try {
            const result = execSync(
                `osascript -e 'tell application "System Events" to name of processes whose name is "${name}"'`,
                { encoding: 'utf-8', timeout: 3000 }
            ).trim();
            if (result && result !== '') {
                return name;
            }
        } catch {
            // Not running
        }
    }
    return null;
}

// ─── Read stdin if piped ─────────────────────────────────────────────

function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
        process.stdin.on('error', reject);

        // Timeout after 5s for non-piped stdin
        setTimeout(() => {
            if (data.length === 0) {
                reject(new Error('No input received from stdin'));
            } else {
                resolve(data);
            }
        }, 5000);
    });
}

// ─── Register Commands ───────────────────────────────────────────────

export function registerAgentCommands(program: Command): void {
    const agent = program
        .command('agent')
        .description('Send text to the IDE agent panel');

    // ─── agent send ─────────────────────────────────────────────────
    agent
        .command('send')
        .description('Send a prompt to the IDE agent/chat panel')
        .argument('[text...]', 'Text to send (or use --stdin / --file)')
        .option('--stdin', 'Read text from stdin (for piping)')
        .option('-f, --file <path>', 'Read text from a file')
        .option('-a, --app <name>', 'Target IDE app name', DEFAULT_APP)
        .option('--focus-key <key>', 'Key to focus agent panel (default: Cmd+L)', DEFAULT_FOCUS_KEY)
        .option('--submit <method>', 'Submit method: "enter" or "cmd+enter"', DEFAULT_SUBMIT)
        .option('-s, --socket <path>', 'Try bridge socket first')
        .option('--no-bridge', 'Skip Tier 2 bridge attempt')
        .option('--dry-run', 'Show what would be sent without executing')
        .action(async (textParts: string[], options) => {
            let text = '';

            // ─── Resolve the text to send ─────────────────────────────
            if (options.stdin) {
                if (!process.stdin.isTTY) {
                    text = await readStdin();
                } else {
                    console.error(chalk.red('✗ --stdin specified but no piped input detected'));
                    console.error(chalk.dim('  Usage: echo "text" | bidirection agent send --stdin'));
                    process.exit(1);
                }
            } else if (options.file) {
                const filePath = path.resolve(options.file);
                if (!fs.existsSync(filePath)) {
                    console.error(chalk.red(`✗ File not found: ${filePath}`));
                    process.exit(1);
                }
                text = fs.readFileSync(filePath, 'utf-8');
            } else if (textParts && textParts.length > 0) {
                text = textParts.join(' ');
            } else {
                console.error(chalk.red('✗ No text provided'));
                console.error(chalk.dim('  Usage: bidirection agent send "your prompt here"'));
                console.error(chalk.dim('         echo "prompt" | bidirection agent send --stdin'));
                console.error(chalk.dim('         bidirection agent send --file prompt.txt'));
                process.exit(1);
            }

            text = text.trim();
            if (text.length === 0) {
                console.error(chalk.red('✗ Empty text — nothing to send'));
                process.exit(1);
            }

            // ─── Detect target app ────────────────────────────────────
            let appName = options.app;
            const preset = IDE_PRESETS[appName];
            const focusKey = options.focusKey || preset?.focusKey || DEFAULT_FOCUS_KEY;
            const submitMethod = options.submit || preset?.submit || DEFAULT_SUBMIT;

            // Auto-detect if default app isn't running
            if (appName === DEFAULT_APP) {
                const detected = detectRunningIDE();
                if (detected && detected !== appName) {
                    appName = detected;
                    console.log(chalk.dim(`  Auto-detected IDE: ${appName}`));
                }
            }

            // ─── Dry run ──────────────────────────────────────────────
            if (options.dryRun) {
                console.log(chalk.bold.cyan('\n🔍 Dry Run:\n'));
                console.log(`  App:        ${chalk.green(appName)}`);
                console.log(`  Focus key:  ${chalk.green('Cmd+' + focusKey)}`);
                console.log(`  Submit:     ${chalk.green(submitMethod)}`);
                console.log(`  Text length: ${text.length} chars`);
                console.log(`  Preview:    ${chalk.dim(text.substring(0, 100))}${text.length > 100 ? '...' : ''}`);
                console.log();
                return;
            }

            // ─── Try strategies ───────────────────────────────────────
            console.log(chalk.dim(`  Sending ${text.length} chars to ${appName} agent panel...`));

            // Strategy 1: Try bridge first (if available)
            if (options.bridge !== false) {
                const bridgeSuccess = await sendViaBridge(text, options.socket);
                if (bridgeSuccess) {
                    console.log(chalk.green(`✓ Sent via bridge (Tier 2)`));
                    process.exit(0);
                }
            }

            // Strategy 2: AppleScript/JXA (macOS only)
            if (process.platform !== 'darwin') {
                console.error(chalk.red('✗ OS-level agent send only supported on macOS'));
                console.error(chalk.dim('  On other platforms, install the BiDirection extension and use --socket'));
                process.exit(1);
            }

            try {
                sendViaAppleScript(text, appName, focusKey, submitMethod);
                console.log(chalk.green(`✓ Sent to ${appName} agent panel (Tier 3: AppleScript)`));
                console.log(chalk.dim(`  ${text.length} chars • Focus: Cmd+${focusKey} • Submit: ${submitMethod}`));
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed to send: ${error.message}`));
                process.exit(1);
            }
        });

    // ─── agent detect ───────────────────────────────────────────────
    agent
        .command('detect')
        .description('Detect which IDE is currently running')
        .action(() => {
            console.log(chalk.bold.cyan('\n🔍 Detecting running IDEs...\n'));

            let found = 0;
            for (const name of Object.keys(IDE_PRESETS)) {
                try {
                    const result = execSync(
                        `osascript -e 'tell application "System Events" to name of processes whose name is "${name}"'`,
                        { encoding: 'utf-8', timeout: 3000 }
                    ).trim();
                    if (result && result !== '') {
                        const preset = IDE_PRESETS[name];
                        console.log(`  ${chalk.green('●')} ${chalk.bold(name)}`);
                        console.log(chalk.dim(`    Focus: Cmd+${preset.focusKey} • Submit: ${preset.submit}`));
                        found++;
                    }
                } catch {
                    // Not running
                }
            }

            if (found === 0) {
                console.log(chalk.yellow('  ⚠ No known IDEs detected'));
                console.log(chalk.dim('  Supported: Antigravity, VS Code, Cursor, Windsurf'));
            }
            console.log();
            process.exit(0);
        });
}
