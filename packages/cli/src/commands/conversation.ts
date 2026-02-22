/**
 * Conversation Commands — Browse Antigravity conversation data
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONVERSATIONS_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'conversations');
const RECORDINGS_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'browser_recordings');

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export function registerConversationCommands(program: Command): void {
    const conv = program
        .command('conv')
        .alias('conversation')
        .description('Browse Antigravity conversation data');

    // ─── conv list ────────────────────────────────────────────────
    conv
        .command('list')
        .description('List all conversations by date/size')
        .option('-n, --recent <count>', 'Show N most recent', '10')
        .option('--all', 'Show all conversations')
        .action((options) => {
            if (!fs.existsSync(CONVERSATIONS_DIR)) {
                console.log(chalk.yellow('No conversations found.'));
                process.exit(0);
            }

            const files = fs.readdirSync(CONVERSATIONS_DIR)
                .filter(f => f.endsWith('.pb'))
                .map(f => {
                    const filePath = path.join(CONVERSATIONS_DIR, f);
                    const stat = fs.statSync(filePath);
                    return {
                        id: f.replace('.pb', ''),
                        size: stat.size,
                        modified: stat.mtime,
                    };
                })
                .sort((a, b) => b.modified.getTime() - a.modified.getTime());

            const limit = options.all ? files.length : parseInt(options.recent);
            const shown = files.slice(0, limit);

            console.log(chalk.bold.cyan(`\n💬 Conversations (${shown.length}/${files.length}):\n`));

            for (const f of shown) {
                // Check if this conversation has brain artifacts
                const brainPath = path.join(os.homedir(), '.gemini', 'antigravity', 'brain', f.id);
                const hasBrain = fs.existsSync(brainPath);
                // Check for recordings
                const hasRecording = fs.existsSync(path.join(RECORDINGS_DIR, f.id));

                const icons = [
                    hasBrain ? '🧠' : '',
                    hasRecording ? '📹' : '',
                ].filter(Boolean).join('');

                console.log(`  ${chalk.dim(f.id.substring(0, 8))}  ${chalk.dim(formatSize(f.size).padEnd(7))} ${chalk.dim(timeAgo(f.modified).padEnd(8))} ${icons}`);
            }
            console.log();
            process.exit(0);
        });

    // ─── conv recordings ──────────────────────────────────────────
    conv
        .command('recordings')
        .description('Show browser recordings for a conversation')
        .argument('[id]', 'Conversation ID (default: latest with recordings)')
        .action((id) => {
            if (!fs.existsSync(RECORDINGS_DIR)) {
                console.log(chalk.yellow('No browser recordings found.'));
                process.exit(0);
            }

            const recordingDirs = fs.readdirSync(RECORDINGS_DIR, { withFileTypes: true })
                .filter(d => d.isDirectory());

            if (id) {
                const dir = recordingDirs.find(d => d.name === id || d.name.startsWith(id));
                if (!dir) {
                    console.error(chalk.red(`No recordings for conversation "${id}".`));
                    console.log(chalk.dim('Available: ' + recordingDirs.map(d => d.name.substring(0, 8)).join(', ')));
                    process.exit(1);
                }

                showRecordings(dir.name);
            } else {
                // List all conversations with recordings
                console.log(chalk.bold.cyan(`\n📹 Conversations with Recordings (${recordingDirs.length}):\n`));
                for (const d of recordingDirs) {
                    const recPath = path.join(RECORDINGS_DIR, d.name);
                    const files = fs.readdirSync(recPath).filter(f => !f.startsWith('.'));
                    console.log(`  ${chalk.dim(d.name.substring(0, 8))} — ${chalk.green(files.length + ' files')}`);
                }
                console.log();
            }
            process.exit(0);
        });
}

function showRecordings(convId: string): void {
    const recPath = path.join(RECORDINGS_DIR, convId);
    const files = fs.readdirSync(recPath)
        .filter(f => !f.startsWith('.'))
        .map(f => {
            const filePath = path.join(recPath, f);
            const stat = fs.statSync(filePath);
            return { name: f, size: stat.size, modified: stat.mtime };
        })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    console.log(chalk.bold.cyan(`\n📹 Recordings for ${convId.substring(0, 8)}... (${files.length}):\n`));
    for (const f of files) {
        const ext = path.extname(f.name).replace('.', '').toUpperCase();
        console.log(`  ${chalk.green(f.name)} ${chalk.dim(formatSize(f.size))} ${chalk.dim(ext)}`);
    }
    console.log(chalk.dim(`\n  Path: ${recPath}\n`));
}
