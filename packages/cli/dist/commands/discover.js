"use strict";
/**
 * Discover Command (Tier 1)
 *
 * Find active VS Code IPC sockets and BiDirection bridge sockets.
 * Optionally export VSCODE_IPC_HOOK_CLI for shell injection.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDiscoverCommand = registerDiscoverCommand;
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@bidirection/core");
function registerDiscoverCommand(program) {
    const discover = program
        .command('discover')
        .description('Scan for active IDE sockets (Tier 1: Socket Discovery)')
        .option('-a, --all', 'Show all sockets including inactive ones')
        .option('-j, --json', 'Output as JSON')
        .action(async (options) => {
        try {
            const sockets = await (0, core_1.discoverAllSockets)();
            const filtered = options.all ? sockets : sockets.filter((s) => s.active);
            if (options.json) {
                console.log(JSON.stringify(filtered, null, 2));
                return;
            }
            if (filtered.length === 0) {
                console.log(chalk_1.default.yellow('⚠ No active IDE sockets found.'));
                console.log(chalk_1.default.dim('  Make sure VS Code or Antigravity is running.'));
                return;
            }
            console.log(chalk_1.default.bold.cyan('\n🔍 Discovered IDE Sockets:\n'));
            for (const sock of filtered) {
                const typeLabel = sock.type === 'bidirection-bridge'
                    ? chalk_1.default.green('BiDirection Bridge')
                    : chalk_1.default.blue('VS Code IPC');
                const statusLabel = sock.active
                    ? chalk_1.default.green('● ACTIVE')
                    : chalk_1.default.red('○ INACTIVE');
                const ageStr = formatAge(sock.age);
                console.log(`  ${statusLabel}  ${typeLabel}`);
                console.log(chalk_1.default.dim(`    Path: ${sock.path}`));
                console.log(chalk_1.default.dim(`    Age:  ${ageStr}`));
                console.log();
            }
            // Suggest injection for the best socket
            const bestVsc = filtered.find((s) => s.type === 'vscode-ipc' && s.active);
            if (bestVsc) {
                console.log(chalk_1.default.bold('💉 To inject into your shell:'));
                console.log(chalk_1.default.cyan(`  ${(0, core_1.getIPCExportCommand)(bestVsc.path)}`));
                console.log();
            }
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(chalk_1.default.red(`Error: ${error.message}`));
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
            console.log((0, core_1.generateAutoInjectScript)());
            return;
        }
        const sockets = await (0, core_1.discoverAllSockets)();
        const vscSocket = sockets.find((s) => s.type === 'vscode-ipc' && s.active);
        if (!vscSocket) {
            console.error(chalk_1.default.red('No active VS Code IPC socket found.'));
            process.exit(1);
        }
        // Output just the export command (for eval)
        console.log((0, core_1.getIPCExportCommand)(vscSocket.path));
    });
}
function formatAge(ms) {
    if (ms < 60000)
        return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3600000)
        return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000)
        return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
}
//# sourceMappingURL=discover.js.map