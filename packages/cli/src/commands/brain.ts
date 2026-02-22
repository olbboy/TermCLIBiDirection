/**
 * Brain Commands — Inspect Antigravity conversation artifacts
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import {
    listBrainConversations,
    getBrainArtifacts,
    readBrainArtifact,
    getBrainLogs,
    detectCurrentConversation,
} from '@bidirection/core';

export function registerBrainCommands(program: Command): void {
    const brain = program
        .command('brain')
        .description('Inspect Antigravity brain artifacts & conversations');

    // ─── brain list ─────────────────────────────────────────────────
    brain
        .command('list')
        .description('List all conversations')
        .option('-n, --recent <count>', 'Show only N most recent', parseInt)
        .action((options) => {
            const conversations = listBrainConversations();
            const limit = options.recent || conversations.length;
            const shown = conversations.slice(0, limit);

            if (shown.length === 0) {
                console.log(chalk.yellow('No conversations found.'));
                process.exit(0);
            }

            console.log(chalk.bold.cyan(`\n🧠 Conversations (${shown.length}/${conversations.length}):\n`));

            for (const conv of shown) {
                const age = timeSince(conv.modifiedAt);
                const icons = [
                    conv.hasTask ? '📋' : '',
                    conv.hasPlan ? '📐' : '',
                    conv.hasWalkthrough ? '📝' : '',
                ].filter(Boolean).join('');

                console.log(`  ${chalk.green(conv.id.substring(0, 8))}  ${chalk.dim(age)}  ${icons}`);
                if (conv.artifacts.length > 0) {
                    console.log(chalk.dim(`    ${conv.artifacts.join(', ')}`));
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
            const convId = id || detectCurrentConversation();
            if (!convId) {
                console.error(chalk.red('No conversation found.'));
                process.exit(1);
            }

            const artifacts = getBrainArtifacts(convId);
            if (artifacts.length === 0) {
                console.error(chalk.red(`No artifacts for ${convId.substring(0, 8)}`));
                process.exit(1);
            }

            console.log(chalk.bold.cyan(`\n🧠 Conversation ${convId.substring(0, 8)}...\n`));

            for (const art of artifacts) {
                const sizeStr = art.size > 1024
                    ? `${(art.size / 1024).toFixed(1)}KB`
                    : `${art.size}B`;
                const meta = art.metadata
                    ? chalk.dim(` (${(art.metadata as any).ArtifactType || 'unknown'})`)
                    : '';
                const versions = art.versions > 1
                    ? chalk.dim(` [${art.versions} versions]`)
                    : '';

                console.log(`  📄 ${chalk.bold(art.name)} ${chalk.dim(sizeStr)}${meta}${versions}`);
                console.log(chalk.dim(`     ${art.path}`));
            }

            // Show logs if available
            const logs = getBrainLogs(convId);
            if (logs.length > 0) {
                console.log(chalk.dim(`\n  📋 Logs: ${logs.map((l: { name: string }) => l.name).join(', ')}`));
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
            const convId = id || detectCurrentConversation();
            if (!convId) {
                console.error(chalk.red('No conversation found.'));
                process.exit(1);
            }

            const content = readBrainArtifact(convId, 'task.md');
            if (!content) {
                console.error(chalk.red('No task.md found.'));
                process.exit(1);
            }

            console.log(chalk.bold.cyan(`\n📋 Task: ${convId.substring(0, 8)}...\n`));
            // Colorize checklist
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.includes('[x]')) {
                    console.log(chalk.green(line));
                } else if (line.includes('[/]')) {
                    console.log(chalk.yellow(line));
                } else if (line.includes('[ ]')) {
                    console.log(chalk.dim(line));
                } else {
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
            const convId = id || detectCurrentConversation();
            if (!convId) {
                console.error(chalk.red('No conversation found.'));
                process.exit(1);
            }

            const logs = getBrainLogs(convId);
            if (logs.length === 0) {
                console.log(chalk.yellow('No logs found.'));
                process.exit(0);
            }

            if (options.list) {
                console.log(chalk.bold.cyan(`\n📋 Logs for ${convId.substring(0, 8)}...\n`));
                for (const log of logs) {
                    console.log(`  ${log.name}`);
                }
                console.log();
                process.exit(0);
            }

            for (const log of logs) {
                console.log(chalk.bold.cyan(`\n═══ ${log.name} ═══\n`));
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
            const convId = id || detectCurrentConversation();
            if (!convId) {
                console.error(chalk.red('No conversation found.'));
                process.exit(1);
            }

            const content = readBrainArtifact(convId, artifact);
            if (!content) {
                console.error(chalk.red(`Artifact "${artifact}" not found in ${convId.substring(0, 8)}`));
                process.exit(1);
            }

            console.log(content);
            process.exit(0);
        });
}

function timeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
