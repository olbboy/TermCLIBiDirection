"use strict";
/**
 * Bridge Commands (Tier 2)
 *
 * Commands that communicate through the BiDirection bridge extension
 * via Unix Domain Socket using JSON-RPC protocol.
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
exports.registerBridgeCommands = registerBridgeCommands;
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const core_1 = require("@bidirection/core");
/**
 * Run a one-shot CLI command with a BridgeClient.
 * Handles connect → execute → disconnect → process.exit(0) lifecycle.
 * Without process.exit(), dangling socket listeners keep the Node.js event loop alive.
 */
async function runWithClient(socketPath, fn) {
    const client = new core_1.BridgeClient(socketPath ? { socketPath } : {});
    try {
        await client.connect();
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(chalk_1.default.red(`✗ Cannot connect to BiDirection bridge.`));
        console.error(chalk_1.default.dim(`  ${error.message}`));
        console.error(chalk_1.default.dim(`  Make sure the BiDirection extension is running in VS Code.`));
        process.exit(1);
    }
    try {
        const result = await fn(client);
        return result;
    }
    finally {
        client.disconnect();
        setImmediate(() => process.exit(0));
    }
}
/**
 * Get a BridgeClient for long-running commands (like watch) that manage their own lifecycle.
 */
async function getClient(socketPath) {
    const client = new core_1.BridgeClient(socketPath ? { socketPath } : {});
    try {
        await client.connect();
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(chalk_1.default.red(`✗ Cannot connect to BiDirection bridge.`));
        console.error(chalk_1.default.dim(`  ${error.message}`));
        console.error(chalk_1.default.dim(`  Make sure the BiDirection extension is running in VS Code.`));
        process.exit(1);
    }
    return client;
}
function registerBridgeCommands(program) {
    // ─── info ───────────────────────────────────────────────────────────
    program
        .command('info')
        .description('Get bridge server information')
        .option('-s, --socket <path>', 'Custom socket path')
        .action(async (options) => {
        await runWithClient(options.socket, async (client) => {
            const info = await client.request(core_1.Methods.GET_INFO);
            console.log(chalk_1.default.bold.cyan('\n📡 BiDirection Bridge Info:\n'));
            console.log(`  IDE:          ${chalk_1.default.green(info.ide)} ${info.ideVersion}`);
            console.log(`  Bridge:       v${info.version}`);
            console.log(`  Socket:       ${chalk_1.default.dim(info.socketPath)}`);
            console.log(`  PID:          ${info.pid}`);
            console.log(`  Workspaces:   ${info.workspaceFolders.join(', ') || chalk_1.default.dim('none')}`);
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
            const result = await client.request(core_1.Methods.PING);
            const elapsed = Date.now() - start;
            console.log(chalk_1.default.green(`✓ pong (${elapsed}ms) v${result.version}`));
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
                const result = await client.request(core_1.Methods.EDITOR_GET_SELECTION, file ? { uri: path.resolve(file) } : {});
                if (options.json) {
                    console.log(JSON.stringify(result, null, 2));
                }
                else {
                    console.log(chalk_1.default.dim(`# Selection: ${result.uri} [${result.startLine}:${result.startCharacter} → ${result.endLine}:${result.endCharacter}]`));
                    console.log(result.text);
                }
            }
            else {
                const result = await client.request(core_1.Methods.EDITOR_GET_TEXT, file ? { uri: path.resolve(file) } : {});
                if (options.json) {
                    console.log(JSON.stringify(result, null, 2));
                }
                else {
                    console.log(chalk_1.default.dim(`# ${result.uri} (${result.languageId}, ${result.lineCount} lines)`));
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
            await client.request(core_1.Methods.WORKSPACE_OPEN_FILE, {
                uri: path.resolve(file),
                line: options.line,
                character: options.character,
            });
            console.log(chalk_1.default.green(`✓ Opened ${path.basename(file)}${options.line ? ` at line ${options.line}` : ''}`));
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
            await client.request(core_1.Methods.EDITOR_APPLY_EDIT, {
                uri: path.resolve(file),
                edits: [{
                        startLine: options.startLine,
                        startCharacter: options.startChar,
                        endLine: options.endLine,
                        endCharacter: options.endChar,
                        newText: options.text,
                    }],
            });
            console.log(chalk_1.default.green(`✓ Edit applied to ${path.basename(file)}`));
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
            await client.request(core_1.Methods.EDITOR_HIGHLIGHT, {
                uri: path.resolve(file),
                startLine: line,
                endLine,
                color: options.color,
            });
            console.log(chalk_1.default.green(`✓ Highlighted ${path.basename(file)} lines ${line}${endLine !== line ? `-${endLine}` : ''}`));
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
            const result = await client.request(core_1.Methods.WORKSPACE_GET_DIAGNOSTICS, file ? { uri: path.resolve(file) } : {});
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
                return;
            }
            if (result.diagnostics.length === 0) {
                console.log(chalk_1.default.green('✓ No diagnostics'));
                return;
            }
            console.log(chalk_1.default.bold(`\n📋 Diagnostics (${result.diagnostics.length}):\n`));
            for (const d of result.diagnostics) {
                const icon = d.severity === 'error' ? chalk_1.default.red('✗') :
                    d.severity === 'warning' ? chalk_1.default.yellow('⚠') :
                        chalk_1.default.blue('ℹ');
                console.log(`  ${icon} ${path.basename(d.uri)}:${d.line + 1}:${d.character + 1}`);
                console.log(chalk_1.default.dim(`    ${d.message}`));
                if (d.source)
                    console.log(chalk_1.default.dim(`    Source: ${d.source}`));
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
            const result = await client.request(core_1.Methods.WORKSPACE_GET_OPEN_FILES);
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
                return;
            }
            console.log(chalk_1.default.bold(`\n📂 Open Files (${result.files.length}):\n`));
            for (const f of result.files) {
                const activeIcon = f.isActive ? chalk_1.default.green('▸') : ' ';
                const dirtyIcon = f.isDirty ? chalk_1.default.yellow('●') : ' ';
                console.log(`  ${activeIcon}${dirtyIcon} ${path.basename(f.uri)} ${chalk_1.default.dim(`(${f.languageId})`)}`);
                console.log(chalk_1.default.dim(`     ${f.uri}`));
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
            let args = [];
            try {
                args = JSON.parse(options.args);
            }
            catch {
                console.error(chalk_1.default.red('Invalid JSON for --args'));
                process.exit(1);
            }
            const result = await client.request(core_1.Methods.COMMAND_EXECUTE, { command, args });
            console.log(chalk_1.default.green(`✓ Executed: ${command}`));
            if (result.result !== undefined) {
                console.log(chalk_1.default.dim(JSON.stringify(result.result, null, 2)));
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
            const result = await client.request(core_1.Methods.WINDOW_SHOW_MESSAGE, {
                message: text,
                type: options.type,
                actions: options.actions,
            });
            if (result.selectedAction) {
                console.log(chalk_1.default.green(`User selected: ${result.selectedAction}`));
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
        console.log(chalk_1.default.bold.cyan('👁 Watching for editor events... (Ctrl+C to stop)\n'));
        client.onNotification(core_1.Methods.EDITOR_ON_CHANGE, (params) => {
            console.log(chalk_1.default.yellow(`[CHANGE] ${path.basename(params.uri)} (${params.changes?.length || 0} changes)`));
        });
        client.onNotification(core_1.Methods.EDITOR_ON_SAVE, (params) => {
            console.log(chalk_1.default.green(`[SAVE]   ${path.basename(params.uri)}`));
        });
        client.onNotification(core_1.Methods.EDITOR_ON_ACTIVE_CHANGE, (params) => {
            console.log(chalk_1.default.blue(`[FOCUS]  ${path.basename(params.uri)} (${params.languageId})`));
        });
        // Keep alive
        process.on('SIGINT', () => {
            console.log(chalk_1.default.dim('\nStopping watch...'));
            client.disconnect();
            process.exit(0);
        });
    });
}
//# sourceMappingURL=bridge.js.map