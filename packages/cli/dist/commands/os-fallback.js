"use strict";
/**
 * OS Fallback Commands (Tier 3)
 *
 * Commands that use macOS system-level features for IDE interaction
 * when no extension bridge is available:
 * - URL Schemes (vscode://)
 * - JXA / AppleScript
 * - AXUIElement (via external Swift binary)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOsFallbackCommands = registerOsFallbackCommands;
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function registerOsFallbackCommands(program) {
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
        const schemeMap = {
            vscode: 'vscode',
            cursor: 'cursor',
            antigravity: 'antigravity', // Speculative
        };
        const scheme = schemeMap[options.ide] || 'vscode';
        const url = `${scheme}://file${absPath}:${line}:${col}`;
        try {
            (0, child_process_1.execSync)(`open "${url}"`, { stdio: 'inherit' });
            console.log(chalk_1.default.green(`✓ Opened via ${scheme}:// → ${path.basename(file)}:${line}:${col}`));
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(chalk_1.default.red(`✗ Failed: ${error.message}`));
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
            const output = (0, child_process_1.execSync)(`osascript -l JavaScript -e '${script}'`, {
                encoding: 'utf-8',
                timeout: 10000,
            });
            console.log(chalk_1.default.bold.cyan(`\n🌳 UI Tree: ${app}\n`));
            console.log(output);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(chalk_1.default.red(`✗ Failed to read UI tree: ${error.message}`));
            console.error(chalk_1.default.dim('  Make sure Accessibility permissions are granted to your terminal.'));
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
        const modifierMap = {
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
            (0, child_process_1.execSync)(`osascript -e '${script}'`, { stdio: 'inherit', timeout: 5000 });
            console.log(chalk_1.default.green(`✓ Sent ${options.modifier}+${key} to ${options.app}`));
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(chalk_1.default.red(`✗ Failed: ${error.message}`));
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
            (0, child_process_1.execSync)(`osascript -e 'tell application "${app}" to activate'`, {
                stdio: 'inherit',
                timeout: 5000,
            });
            console.log(chalk_1.default.green(`✓ Activated ${app}`));
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(chalk_1.default.red(`✗ Failed: ${error.message}`));
            process.exit(1);
        }
    });
}
function getUITreeScript(app, maxDepth) {
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
//# sourceMappingURL=os-fallback.js.map