/**
 * OS Fallback Commands (Tier 3)
 * 
 * Commands that use macOS system-level features for IDE interaction
 * when no extension bridge is available:
 * - URL Schemes (vscode://)
 * - JXA / AppleScript
 * - AXUIElement (via external Swift binary)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { execSync } from 'child_process';

export function registerOsFallbackCommands(program: Command): void {
    const os = program
        .command('os')
        .description('OS-level IDE control (Tier 3: no extension required)');

    // ─── os open ────────────────────────────────────────────────────────
    os
        .command('open')
        .description('Open file via URL scheme (vscode://)')
        .argument('<file>', 'File path')
        .option('-l, --line <number>', 'Go to line', parseInt)
        .option('-c, --column <number>', 'Go to column', parseInt)
        .option('--ide <ide>', 'IDE: vscode, cursor, antigravity', 'vscode')
        .action((file, options) => {
            const absPath = path.resolve(file);
            const line = options.line || 1;
            const col = options.column || 1;

            const schemeMap: Record<string, string> = {
                vscode: 'vscode',
                cursor: 'cursor',
                antigravity: 'antigravity', // Speculative
            };

            const scheme = schemeMap[options.ide] || 'vscode';
            const url = `${scheme}://file${absPath}:${line}:${col}`;

            try {
                execSync(`open "${url}"`, { stdio: 'inherit' });
                console.log(chalk.green(`✓ Opened via ${scheme}:// → ${path.basename(file)}:${line}:${col}`));
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed: ${error.message}`));
                process.exit(1);
            }
        });

    // ─── os ui-tree ─────────────────────────────────────────────────────
    os
        .command('ui-tree')
        .description('Dump UI accessibility tree of target app (JXA)')
        .argument('[app]', 'Application name', 'Code')
        .option('-d, --depth <n>', 'Max depth', parseInt, 3)
        .action((app, options) => {
            const script = getUITreeScript(app, options.depth);
            try {
                const output = execSync(`osascript -l JavaScript -e '${script}'`, {
                    encoding: 'utf-8',
                    timeout: 10000,
                });
                console.log(chalk.bold.cyan(`\n🌳 UI Tree: ${app}\n`));
                console.log(output);
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed to read UI tree: ${error.message}`));
                console.error(chalk.dim('  Make sure Accessibility permissions are granted to your terminal.'));
                process.exit(1);
            }
        });

    // ─── os keystroke ───────────────────────────────────────────────────
    os
        .command('keystroke')
        .description('Send keystroke to target app (AppleScript)')
        .argument('<key>', 'Key to send (e.g., "s" for Cmd+S)')
        .option('--app <app>', 'Target application', 'Code')
        .option('--modifier <mod>', 'Modifier: command, option, control, shift', 'command')
        .action((key, options) => {
            const modifierMap: Record<string, string> = {
                command: 'command down',
                option: 'option down',
                control: 'control down',
                shift: 'shift down',
            };

            const modifier = modifierMap[options.modifier] || 'command down';
            const script = `
        tell application "${options.app}" to activate
        delay 0.3
        tell application "System Events"
          keystroke "${key}" using {${modifier}}
        end tell
      `.trim();

            try {
                execSync(`osascript -e '${script}'`, { stdio: 'inherit', timeout: 5000 });
                console.log(chalk.green(`✓ Sent ${options.modifier}+${key} to ${options.app}`));
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed: ${error.message}`));
                process.exit(1);
            }
        });

    // ─── os activate ────────────────────────────────────────────────────
    os
        .command('activate')
        .description('Bring IDE window to front')
        .argument('[app]', 'Application name', 'Code')
        .action((app) => {
            try {
                execSync(`osascript -e 'tell application "${app}" to activate'`, {
                    stdio: 'inherit',
                    timeout: 5000,
                });
                console.log(chalk.green(`✓ Activated ${app}`));
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed: ${error.message}`));
                process.exit(1);
            }
        });
}

function getUITreeScript(app: string, maxDepth: number): string {
    return `
    var se = Application("System Events");
    var proc = se.processes["${app}"];
    function dump(el, depth) {
      if (depth > ${maxDepth}) return "";
      var indent = "  ".repeat(depth);
      var role = "";
      var title = "";
      try { role = el.role(); } catch(e) {}
      try { title = el.title() || el.description() || el.value() || ""; } catch(e) {}
      var line = indent + role + (title ? ': "' + String(title).substring(0, 80) + '"' : '') + "\\n";
      try {
        var children = el.uiElements();
        for (var i = 0; i < Math.min(children.length, 20); i++) {
          line += dump(children[i], depth + 1);
        }
      } catch(e) {}
      return line;
    }
    var result = "";
    try {
      var wins = proc.windows();
      for (var i = 0; i < wins.length; i++) {
        result += dump(wins[i], 0);
      }
    } catch(e) { result = "Error: " + e.message; }
    result;
  `.replace(/'/g, "\\'").replace(/\n/g, ' ');
}
