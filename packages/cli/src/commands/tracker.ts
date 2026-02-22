/**
 * Code Tracker — Inspect Antigravity's active code tracking snapshots
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const TRACKER_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'code_tracker', 'active');

interface TrackedProject {
    name: string;
    hash: string;
    dirName: string;
    path: string;
    fileCount: number;
    lastModified: Date;
}

interface TrackedFile {
    md5: string;
    filename: string;
    fullPath: string;
    size: number;
    modified: Date;
}

function listTrackedProjects(): TrackedProject[] {
    if (!fs.existsSync(TRACKER_DIR)) return [];

    return fs.readdirSync(TRACKER_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => {
            const parts = d.name.match(/^(.+)_([a-f0-9]{40})$/);
            const projectPath = path.join(TRACKER_DIR, d.name);
            const files = fs.readdirSync(projectPath).filter(f => !f.startsWith('.'));
            const stat = fs.statSync(projectPath);

            return {
                name: parts ? parts[1] : d.name,
                hash: parts ? parts[2] : '',
                dirName: d.name,
                path: projectPath,
                fileCount: files.length,
                lastModified: stat.mtime,
            };
        })
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

function listTrackedFiles(projectDir: string): TrackedFile[] {
    if (!fs.existsSync(projectDir)) return [];

    return fs.readdirSync(projectDir)
        .filter(f => !f.startsWith('.'))
        .map(f => {
            const match = f.match(/^([a-f0-9]+)_(.+)$/);
            const fullPath = path.join(projectDir, f);
            const stat = fs.statSync(fullPath);
            return {
                md5: match ? match[1] : '',
                filename: match ? match[2] : f,
                fullPath,
                size: stat.size,
                modified: stat.mtime,
            };
        })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

export function registerTrackerCommands(program: Command): void {
    const tracker = program
        .command('tracker')
        .description('Inspect Antigravity code tracker snapshots');

    // ─── tracker list ─────────────────────────────────────────────
    tracker
        .command('list')
        .description('List all tracked projects')
        .action(() => {
            const projects = listTrackedProjects();

            if (projects.length === 0) {
                console.log(chalk.yellow('No tracked projects.'));
                process.exit(0);
            }

            console.log(chalk.bold.cyan(`\n📍 Tracked Projects (${projects.length}):\n`));
            for (const p of projects) {
                console.log(`  ${chalk.bold.green(p.name)} ${chalk.dim(timeAgo(p.lastModified))}`);
                console.log(chalk.dim(`    ${p.fileCount} files • ${p.hash.substring(0, 8)}...`));
            }
            console.log();
            process.exit(0);
        });

    // ─── tracker files ────────────────────────────────────────────
    tracker
        .command('files')
        .description('Show agent-edited files for a project')
        .argument('[project]', 'Project name (fuzzy match, default: current)')
        .action((projectName) => {
            const projects = listTrackedProjects();

            let project: TrackedProject | undefined;
            if (projectName) {
                project = projects.find(p =>
                    p.name === projectName ||
                    p.name.toLowerCase().includes(projectName.toLowerCase())
                );
            } else {
                // Auto-detect from cwd
                const cwdName = path.basename(process.cwd());
                project = projects.find(p =>
                    p.name.toLowerCase() === cwdName.toLowerCase()
                );
                if (!project && projects.length > 0) {
                    project = projects[0]; // most recent
                }
            }

            if (!project) {
                console.error(chalk.red(`Project "${projectName || 'current'}" not found in tracker.`));
                console.log(chalk.dim('Available: ' + projects.map(p => p.name).join(', ')));
                process.exit(1);
            }

            const files = listTrackedFiles(project.path);

            console.log(chalk.bold.cyan(`\n📍 ${project.name} — ${files.length} tracked files:\n`));
            for (const f of files) {
                console.log(`  ${chalk.green(f.filename)} ${chalk.dim(formatSize(f.size))} ${chalk.dim(timeAgo(f.modified))}`);
            }
            console.log();
            process.exit(0);
        });

    // ─── tracker diff ─────────────────────────────────────────────
    tracker
        .command('diff')
        .description('Diff tracked snapshot vs current workspace file')
        .argument('<file>', 'Filename to diff')
        .argument('[project]', 'Project name (default: current)')
        .action((fileName, projectName) => {
            const projects = listTrackedProjects();
            let project: TrackedProject | undefined;

            if (projectName) {
                project = projects.find(p =>
                    p.name.toLowerCase().includes(projectName.toLowerCase())
                );
            } else {
                const cwdName = path.basename(process.cwd());
                project = projects.find(p =>
                    p.name.toLowerCase() === cwdName.toLowerCase()
                ) || projects[0];
            }

            if (!project) {
                console.error(chalk.red('Project not found in tracker.'));
                process.exit(1);
            }

            const files = listTrackedFiles(project.path);
            const tracked = files.find(f =>
                f.filename === fileName || f.filename.includes(fileName)
            );

            if (!tracked) {
                console.error(chalk.red(`File "${fileName}" not found in tracker.`));
                console.log(chalk.dim('Tracked files: ' + files.map(f => f.filename).join(', ')));
                process.exit(1);
            }

            // Find workspace file
            const workspaceFile = findWorkspaceFile(tracked.filename);
            if (!workspaceFile) {
                console.log(chalk.yellow(`Workspace file not found. Showing tracked snapshot:`));
                console.log(fs.readFileSync(tracked.fullPath, 'utf-8'));
                process.exit(0);
            }

            try {
                const diff = execSync(
                    `diff -u "${workspaceFile}" "${tracked.fullPath}" || true`,
                    { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 5 }
                );
                if (!diff.trim()) {
                    console.log(chalk.green('✓ Files are identical'));
                } else {
                    console.log(chalk.bold.cyan(`\n📍 Diff: workspace → tracker snapshot\n`));
                    // Colorize diff output
                    for (const line of diff.split('\n')) {
                        if (line.startsWith('+')) console.log(chalk.green(line));
                        else if (line.startsWith('-')) console.log(chalk.red(line));
                        else if (line.startsWith('@')) console.log(chalk.cyan(line));
                        else console.log(line);
                    }
                }
            } catch {
                console.error(chalk.red('✗ Diff failed'));
                process.exit(1);
            }
            process.exit(0);
        });
}

function findWorkspaceFile(filename: string): string | null {
    // Search in cwd and common source directories
    const searchDirs = [process.cwd()];
    try {
        const gitRoot = execSync('git rev-parse --show-toplevel', {
            encoding: 'utf-8', timeout: 3000
        }).trim();
        if (gitRoot) searchDirs.unshift(gitRoot);
    } catch { }

    for (const dir of searchDirs) {
        try {
            const result = execSync(
                `find "${dir}" -name "${filename}" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | head -1`,
                { encoding: 'utf-8', timeout: 5000 }
            ).trim();
            if (result) return result;
        } catch { }
    }
    return null;
}
