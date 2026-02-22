"use strict";
/**
 * MCP Server Management — Configure Antigravity's MCP servers
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
exports.registerMcpCommands = registerMcpCommands;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const MCP_CONFIG_PATH = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
function readConfig() {
    if (!fs.existsSync(MCP_CONFIG_PATH)) {
        return { mcpServers: {} };
    }
    return JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
}
function writeConfig(config) {
    fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
function registerMcpCommands(program) {
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
            console.log(chalk_1.default.yellow('No MCP servers configured.'));
            console.log(chalk_1.default.dim(`  Config: ${MCP_CONFIG_PATH}`));
            process.exit(0);
        }
        console.log(chalk_1.default.bold.cyan(`\n🔌 MCP Servers (${servers.length}):\n`));
        for (const [name, server] of servers) {
            const cmd = [server.command, ...(server.args || [])].join(' ');
            const envKeys = server.env ? Object.keys(server.env) : [];
            const envHint = envKeys.length > 0 ? chalk_1.default.dim(` [env: ${envKeys.join(', ')}]`) : '';
            console.log(`  ${chalk_1.default.green(name)}`);
            console.log(chalk_1.default.dim(`    $ ${cmd}${envHint}`));
        }
        console.log(chalk_1.default.dim(`\n  Config: ${MCP_CONFIG_PATH}\n`));
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
            console.error(chalk_1.default.red(`MCP server "${name}" not found.`));
            const names = Object.keys(config.mcpServers);
            if (names.length > 0) {
                console.log(chalk_1.default.dim('Available: ' + names.join(', ')));
            }
            process.exit(1);
        }
        console.log(chalk_1.default.bold.cyan(`\n🔌 ${name}\n`));
        console.log(`  Command:  ${chalk_1.default.green(server.command)}`);
        if (server.args?.length) {
            console.log(`  Args:     ${chalk_1.default.dim(server.args.join(' '))}`);
        }
        if (server.env) {
            console.log(`  Env:`);
            for (const [k, v] of Object.entries(server.env)) {
                const masked = v.length > 8 ? v.substring(0, 4) + '...' + v.substring(v.length - 4) : '***';
                console.log(`    ${chalk_1.default.dim(k)} = ${chalk_1.default.yellow(masked)}`);
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
            console.error(chalk_1.default.red(`MCP server "${name}" already exists. Remove it first.`));
            process.exit(1);
        }
        const server = { command };
        if (args?.length)
            server.args = args;
        if (options.env) {
            server.env = {};
            for (const pair of options.env) {
                const [k, ...v] = pair.split('=');
                server.env[k] = v.join('=');
            }
        }
        config.mcpServers[name] = server;
        writeConfig(config);
        console.log(chalk_1.default.green(`✓ Added MCP server: ${name}`));
        console.log(chalk_1.default.dim(`  Restart Antigravity for changes to take effect.`));
    });
    // ─── mcp remove ───────────────────────────────────────────────
    mcp
        .command('remove')
        .description('Remove an MCP server')
        .argument('<name>', 'Server name')
        .action((name) => {
        const config = readConfig();
        if (!config.mcpServers[name]) {
            console.error(chalk_1.default.red(`MCP server "${name}" not found.`));
            process.exit(1);
        }
        delete config.mcpServers[name];
        writeConfig(config);
        console.log(chalk_1.default.green(`✓ Removed MCP server: ${name}`));
        console.log(chalk_1.default.dim(`  Restart Antigravity for changes to take effect.`));
    });
}
//# sourceMappingURL=mcp.js.map