/**
 * MCP Server Management — Configure Antigravity's MCP servers
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const MCP_CONFIG_PATH = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');

interface McpServer {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}

interface McpConfig {
    mcpServers: Record<string, McpServer>;
}

function readConfig(): McpConfig {
    if (!fs.existsSync(MCP_CONFIG_PATH)) {
        return { mcpServers: {} };
    }
    return JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
}

function writeConfig(config: McpConfig): void {
    fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function registerMcpCommands(program: Command): void {
    const mcp = program
        .command('mcp')
        .description('Manage Antigravity MCP server configuration');

    // ─── mcp list ─────────────────────────────────────────────────
    mcp
        .command('list')
        .description('List configured MCP servers')
        .action(() => {
            const config = readConfig();
            const servers = Object.entries(config.mcpServers);

            if (servers.length === 0) {
                console.log(chalk.yellow('No MCP servers configured.'));
                console.log(chalk.dim(`  Config: ${MCP_CONFIG_PATH}`));
                process.exit(0);
            }

            console.log(chalk.bold.cyan(`\n🔌 MCP Servers (${servers.length}):\n`));
            for (const [name, server] of servers) {
                const cmd = [server.command, ...(server.args || [])].join(' ');
                const envKeys = server.env ? Object.keys(server.env) : [];
                const envHint = envKeys.length > 0 ? chalk.dim(` [env: ${envKeys.join(', ')}]`) : '';
                console.log(`  ${chalk.green(name)}`);
                console.log(chalk.dim(`    $ ${cmd}${envHint}`));
            }
            console.log(chalk.dim(`\n  Config: ${MCP_CONFIG_PATH}\n`));
            process.exit(0);
        });

    // ─── mcp show ─────────────────────────────────────────────────
    mcp
        .command('show')
        .description('Show details of an MCP server')
        .argument('<name>', 'Server name')
        .action((name) => {
            const config = readConfig();
            const server = config.mcpServers[name];

            if (!server) {
                console.error(chalk.red(`MCP server "${name}" not found.`));
                const names = Object.keys(config.mcpServers);
                if (names.length > 0) {
                    console.log(chalk.dim('Available: ' + names.join(', ')));
                }
                process.exit(1);
            }

            console.log(chalk.bold.cyan(`\n🔌 ${name}\n`));
            console.log(`  Command:  ${chalk.green(server.command)}`);
            if (server.args?.length) {
                console.log(`  Args:     ${chalk.dim(server.args.join(' '))}`);
            }
            if (server.env) {
                console.log(`  Env:`);
                for (const [k, v] of Object.entries(server.env)) {
                    const masked = v.length > 8 ? v.substring(0, 4) + '...' + v.substring(v.length - 4) : '***';
                    console.log(`    ${chalk.dim(k)} = ${chalk.yellow(masked)}`);
                }
            }
            console.log();
            process.exit(0);
        });

    // ─── mcp add ──────────────────────────────────────────────────
    mcp
        .command('add')
        .description('Add an MCP server')
        .argument('<name>', 'Server name')
        .argument('<command>', 'Command to run')
        .argument('[args...]', 'Command arguments')
        .option('-e, --env <pairs...>', 'Environment variables (KEY=VALUE)')
        .action((name, command, args, options) => {
            const config = readConfig();

            if (config.mcpServers[name]) {
                console.error(chalk.red(`MCP server "${name}" already exists. Remove it first.`));
                process.exit(1);
            }

            const server: McpServer = { command };
            if (args?.length) server.args = args;
            if (options.env) {
                server.env = {};
                for (const pair of options.env) {
                    const [k, ...v] = pair.split('=');
                    server.env[k] = v.join('=');
                }
            }

            config.mcpServers[name] = server;
            writeConfig(config);

            console.log(chalk.green(`✓ Added MCP server: ${name}`));
            console.log(chalk.dim(`  Restart Antigravity for changes to take effect.`));
        });

    // ─── mcp remove ───────────────────────────────────────────────
    mcp
        .command('remove')
        .description('Remove an MCP server')
        .argument('<name>', 'Server name')
        .action((name) => {
            const config = readConfig();

            if (!config.mcpServers[name]) {
                console.error(chalk.red(`MCP server "${name}" not found.`));
                process.exit(1);
            }

            delete config.mcpServers[name];
            writeConfig(config);

            console.log(chalk.green(`✓ Removed MCP server: ${name}`));
            console.log(chalk.dim(`  Restart Antigravity for changes to take effect.`));
        });
}
