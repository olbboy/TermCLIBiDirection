"use strict";
/**
 * Brain Commands — Inspect Antigravity conversation artifacts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBrainCommands = registerBrainCommands;
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@bidirection/core");
function registerBrainCommands(program) {
    const brain = program
        .command('brain')
        .description('Inspect Antigravity brain artifacts & conversations');
    // ─── brain list ─────────────────────────────────────────────────
    brain
        .command('list')
        .description('List all conversations')
        .option('-n, --recent <count>', 'Show only N most recent', parseInt)
        .action((options) => {
        const conversations = (0, core_1.listBrainConversations)();
        const limit = options.recent || conversations.length;
        const shown = conversations.slice(0, limit);
        if (shown.length === 0) {
            console.log(chalk_1.default.yellow('No conversations found.'));
            process.exit(0);
        }
        console.log(chalk_1.default.bold.cyan(`\n🧠 Conversations (${shown.length}/${conversations.length}):\n`));
        for (const conv of shown) {
            const age = timeSince(conv.modifiedAt);
            const icons = [
                conv.hasTask ? '📋' : '',
                conv.hasPlan ? '📐' : '',
                conv.hasWalkthrough ? '📝' : '',
            ].filter(Boolean).join('');
            console.log(`  ${chalk_1.default.green(conv.id.substring(0, 8))}  ${chalk_1.default.dim(age)}  ${icons}`);
            if (conv.artifacts.length > 0) {
                console.log(chalk_1.default.dim(`    ${conv.artifacts.join(', ')}`));
            }
        }
        console.log();
        process.exit(0);
    });
    // ─── brain show ─────────────────────────────────────────────────
    brain
        .command('show')
        .description('Show artifacts for a conversation')
        .argument('[id]', 'Conversation ID (default: most recent)')
        .action((id) => {
        const convId = id || (0, core_1.detectCurrentConversation)();
        if (!convId) {
            console.error(chalk_1.default.red('No conversation found.'));
            process.exit(1);
        }
        const artifacts = (0, core_1.getBrainArtifacts)(convId);
        if (artifacts.length === 0) {
            console.error(chalk_1.default.red(`No artifacts for ${convId.substring(0, 8)}`));
            process.exit(1);
        }
        console.log(chalk_1.default.bold.cyan(`\n🧠 Conversation ${convId.substring(0, 8)}...\n`));
        for (const art of artifacts) {
            const sizeStr = art.size > 1024
                ? `${(art.size / 1024).toFixed(1)}KB`
                : `${art.size}B`;
            const meta = art.metadata
                ? chalk_1.default.dim(` (${art.metadata.ArtifactType || 'unknown'})`)
                : '';
            const versions = art.versions > 1
                ? chalk_1.default.dim(` [${art.versions} versions]`)
                : '';
            console.log(`  📄 ${chalk_1.default.bold(art.name)} ${chalk_1.default.dim(sizeStr)}${meta}${versions}`);
            console.log(chalk_1.default.dim(`     ${art.path}`));
        }
        // Show logs if available
        const logs = (0, core_1.getBrainLogs)(convId);
        if (logs.length > 0) {
            console.log(chalk_1.default.dim(`\n  📋 Logs: ${logs.map((l) => l.name).join(', ')}`));
        }
        console.log();
        process.exit(0);
    });
    // ─── brain task ─────────────────────────────────────────────────
    brain
        .command('task')
        .description('Show the task checklist')
        .argument('[id]', 'Conversation ID (default: most recent)')
        .action((id) => {
        const convId = id || (0, core_1.detectCurrentConversation)();
        if (!convId) {
            console.error(chalk_1.default.red('No conversation found.'));
            process.exit(1);
        }
        const content = (0, core_1.readBrainArtifact)(convId, 'task.md');
        if (!content) {
            console.error(chalk_1.default.red('No task.md found.'));
            process.exit(1);
        }
        console.log(chalk_1.default.bold.cyan(`\n📋 Task: ${convId.substring(0, 8)}...\n`));
        // Colorize checklist
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.includes('[x]')) {
                console.log(chalk_1.default.green(line));
            }
            else if (line.includes('[/]')) {
                console.log(chalk_1.default.yellow(line));
            }
            else if (line.includes('[ ]')) {
                console.log(chalk_1.default.dim(line));
            }
            else {
                console.log(line);
            }
        }
        console.log();
        process.exit(0);
    });
    // ─── brain logs ─────────────────────────────────────────────────
    brain
        .command('logs')
        .description('Show system-generated task logs')
        .argument('[id]', 'Conversation ID (default: most recent)')
        .option('--tail <lines>', 'Show last N lines', parseInt)
        .option('-l, --list', 'Only list log file names')
        .action((id, options) => {
        const convId = id || (0, core_1.detectCurrentConversation)();
        if (!convId) {
            console.error(chalk_1.default.red('No conversation found.'));
            process.exit(1);
        }
        const logs = (0, core_1.getBrainLogs)(convId);
        if (logs.length === 0) {
            console.log(chalk_1.default.yellow('No logs found.'));
            process.exit(0);
        }
        if (options.list) {
            console.log(chalk_1.default.bold.cyan(`\n📋 Logs for ${convId.substring(0, 8)}...\n`));
            for (const log of logs) {
                console.log(`  ${log.name}`);
            }
            console.log();
            process.exit(0);
        }
        for (const log of logs) {
            console.log(chalk_1.default.bold.cyan(`\n═══ ${log.name} ═══\n`));
            let content = log.content;
            if (options.tail) {
                const lines = content.split('\n');
                content = lines.slice(-options.tail).join('\n');
            }
            console.log(content);
        }
        process.exit(0);
    });
    // ─── brain read ─────────────────────────────────────────────────
    brain
        .command('read')
        .description('Read a specific artifact file')
        .argument('<artifact>', 'Artifact filename (e.g., walkthrough.md)')
        .argument('[id]', 'Conversation ID (default: most recent)')
        .action((artifact, id) => {
        const convId = id || (0, core_1.detectCurrentConversation)();
        if (!convId) {
            console.error(chalk_1.default.red('No conversation found.'));
            process.exit(1);
        }
        const content = (0, core_1.readBrainArtifact)(convId, artifact);
        if (!content) {
            console.error(chalk_1.default.red(`Artifact "${artifact}" not found in ${convId.substring(0, 8)}`));
            process.exit(1);
        }
        console.log(content);
        process.exit(0);
    });
}
function timeSince(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
//# sourceMappingURL=brain.js.map