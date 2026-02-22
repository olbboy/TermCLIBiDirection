/**
 * System Commands — Antigravity system info and configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const HOME = os.homedir();
const AG_DIR = path.join(HOME, '.gemini', 'antigravity');
const APP_SUPPORT = path.join(HOME, 'Library', 'Application Support', 'Antigravity');
const EXTENSIONS_DIR = path.join(HOME, '.antigravity', 'extensions');
const ALLOWLIST_PATH = path.join(AG_DIR, 'browserAllowlist.txt');
const INSTALLATION_ID_PATH = path.join(AG_DIR, 'installation_id');
const MCP_CONFIG_PATH = path.join(AG_DIR, 'mcp_config.json');

function countDir(dirPath: string): number {
    try {
        return fs.readdirSync(dirPath).filter(f => !f.startsWith('.')).length;
    } catch { return 0; }
}

function dirSize(dirPath: string): number {
    let total = 0;
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isFile()) {
                total += fs.statSync(fullPath).size;
            } else if (entry.isDirectory()) {
                total += dirSize(fullPath);
            }
        }
    } catch { }
    return total;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}G`;
}

export function registerSystemCommands(program: Command): void {
    const system = program
        .command('system')
        .alias('sys')
        .description('Antigravity system info & configuration');

    // ─── system info ──────────────────────────────────────────────
    system
        .command('info')
        .description('Show full Antigravity system information')
        .action(() => {
            console.log(chalk.bold.cyan('\n⚙️  Antigravity System Info\n'));

            // Installation ID
            let installId = 'unknown';
            try { installId = fs.readFileSync(INSTALLATION_ID_PATH, 'utf-8').trim(); } catch { }
            console.log(`  ${chalk.dim('Installation:')}  ${chalk.green(installId)}`);

            // Data directory
            console.log(`  ${chalk.dim('Data Dir:')}      ${AG_DIR}`);
            console.log(`  ${chalk.dim('App Support:')}   ${APP_SUPPORT}`);

            // Counts
            const brainCount = countDir(path.join(AG_DIR, 'brain'));
            const convCount = countDir(path.join(AG_DIR, 'conversations'));
            const kiCount = countDir(path.join(AG_DIR, 'knowledge'));
            const trackerCount = countDir(path.join(AG_DIR, 'code_tracker', 'active'));
            const recordingCount = countDir(path.join(AG_DIR, 'browser_recordings'));

            console.log();
            console.log(chalk.bold('  📊 Data:'));
            console.log(`    Conversations:    ${chalk.green(String(convCount))}`);
            console.log(`    Brain Artifacts:  ${chalk.green(String(brainCount))}`);
            console.log(`    Knowledge Items:  ${chalk.green(String(kiCount))}`);
            console.log(`    Tracked Projects: ${chalk.green(String(trackerCount))}`);
            console.log(`    Recordings:       ${chalk.green(String(recordingCount))}`);

            // Size
            const brainSize = dirSize(path.join(AG_DIR, 'brain'));
            const convSize = dirSize(path.join(AG_DIR, 'conversations'));
            const kiSize = dirSize(path.join(AG_DIR, 'knowledge'));
            const implicitSize = dirSize(path.join(AG_DIR, 'implicit'));
            const totalSize = brainSize + convSize + kiSize + implicitSize;

            console.log();
            console.log(chalk.bold('  💾 Storage:'));
            console.log(`    Brain:            ${chalk.dim(formatSize(brainSize))}`);
            console.log(`    Conversations:    ${chalk.dim(formatSize(convSize))}`);
            console.log(`    Knowledge:        ${chalk.dim(formatSize(kiSize))}`);
            console.log(`    Implicit Context: ${chalk.dim(formatSize(implicitSize))}`);
            console.log(`    ${chalk.bold('Total:')}           ${chalk.yellow(formatSize(totalSize))}`);

            // MCP Servers
            try {
                const mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
                const serverNames = Object.keys(mcpConfig.mcpServers || {});
                console.log();
                console.log(chalk.bold('  🔌 MCP Servers:'));
                if (serverNames.length === 0) {
                    console.log(chalk.dim('    None configured'));
                } else {
                    for (const name of serverNames) {
                        console.log(`    ${chalk.green(name)}`);
                    }
                }
            } catch { }

            // Extensions
            try {
                const extensions = fs.readdirSync(EXTENSIONS_DIR)
                    .filter(d => !d.startsWith('.') && !d.endsWith('.json'));
                console.log();
                console.log(chalk.bold(`  🧩 Extensions (${extensions.length}):`));
                for (const ext of extensions.slice(0, 10)) {
                    console.log(`    ${chalk.dim(ext)}`);
                }
                if (extensions.length > 10) {
                    console.log(chalk.dim(`    ... and ${extensions.length - 10} more`));
                }
            } catch { }

            // Browser Allowlist
            try {
                const content = fs.readFileSync(ALLOWLIST_PATH, 'utf-8').trim();
                const domains = content ? content.split('\n').filter(Boolean) : [];
                console.log();
                console.log(chalk.bold('  🌐 Browser Allowlist:'));
                if (domains.length === 0) {
                    console.log(chalk.dim('    (empty — all domains allowed)'));
                } else {
                    for (const d of domains) {
                        console.log(`    ${chalk.green(d)}`);
                    }
                }
            } catch { }

            console.log();
            process.exit(0);
        });

    // ─── system browser-allow ─────────────────────────────────────
    system
        .command('browser-allow')
        .description('Add a domain to the browser allowlist')
        .argument('<domain>', 'Domain to allow')
        .action((domain) => {
            let content = '';
            try { content = fs.readFileSync(ALLOWLIST_PATH, 'utf-8'); } catch { }

            const domains = content.split('\n').filter(Boolean);
            if (domains.includes(domain)) {
                console.log(chalk.yellow(`Domain "${domain}" already in allowlist.`));
                process.exit(0);
            }

            domains.push(domain);
            fs.writeFileSync(ALLOWLIST_PATH, domains.join('\n') + '\n', 'utf-8');
            console.log(chalk.green(`✓ Added "${domain}" to browser allowlist`));
            console.log(chalk.dim('  Restart Antigravity for changes to take effect.'));
        });

    // ─── system browser-deny ──────────────────────────────────────
    system
        .command('browser-deny')
        .description('Remove a domain from the browser allowlist')
        .argument('<domain>', 'Domain to remove')
        .action((domain) => {
            let content = '';
            try { content = fs.readFileSync(ALLOWLIST_PATH, 'utf-8'); } catch { }

            const domains = content.split('\n').filter(Boolean);
            const filtered = domains.filter(d => d !== domain);

            if (filtered.length === domains.length) {
                console.log(chalk.yellow(`Domain "${domain}" not in allowlist.`));
                process.exit(0);
            }

            fs.writeFileSync(ALLOWLIST_PATH, filtered.join('\n') + (filtered.length > 0 ? '\n' : ''), 'utf-8');
            console.log(chalk.green(`✓ Removed "${domain}" from browser allowlist`));
        });
}
