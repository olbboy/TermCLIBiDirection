"use strict";
/**
 * Workflow Commands — Manage and trigger Antigravity workflows
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
exports.registerWorkflowCommands = registerWorkflowCommands;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const core_1 = require("@bidirection/core");
const DEFAULT_APP = 'Antigravity';
function getProjectRoot() {
    // Walk up to find a git root or use cwd
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, '.git')))
            return dir;
        dir = path.dirname(dir);
    }
    return process.cwd();
}
function sendToAgent(text, appName) {
    const escapedText = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
    const script = `
        set the clipboard to "${escapedText}"
        tell application "${appName}" to activate
        delay 0.5
        tell application "System Events"
            tell process "${appName}"
                keystroke "l" using {command down}
                delay 0.5
                keystroke "a" using {command down}
                delay 0.1
                keystroke "v" using {command down}
                delay 0.3
                keystroke return
            end tell
        end tell
        return "ok"
    `;
    (0, child_process_1.execSync)(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
        encoding: 'utf-8',
        timeout: 15000,
    });
}
function registerWorkflowCommands(program) {
    const wf = program
        .command('workflow')
        .alias('wf')
        .description('Manage & trigger Antigravity workflows');
    // ─── workflow list ──────────────────────────────────────────────
    wf
        .command('list')
        .description('List available workflows in current project')
        .action(() => {
        const root = getProjectRoot();
        const workflows = (0, core_1.listWorkflows)(root);
        if (workflows.length === 0) {
            console.log(chalk_1.default.yellow('No workflows found.'));
            console.log(chalk_1.default.dim(`  Create one: bidirection workflow create <name> "<description>"`));
            process.exit(0);
        }
        console.log(chalk_1.default.bold.cyan(`\n⚡ Workflows (${workflows.length}):\n`));
        for (const wf of workflows) {
            const turbo = wf.hasTurboAll ? chalk_1.default.green(' ⚡turbo') : '';
            console.log(`  ${chalk_1.default.green('/' + wf.slug)}${turbo}`);
            if (wf.description) {
                console.log(chalk_1.default.dim(`    ${wf.description}`));
            }
        }
        console.log();
        process.exit(0);
    });
    // ─── workflow show ─────────────────────────────────────────────
    wf
        .command('show')
        .description('Show workflow steps')
        .argument('<name>', 'Workflow name or slug')
        .action((name) => {
        const root = getProjectRoot();
        const workflow = (0, core_1.getWorkflow)(root, name);
        if (!workflow) {
            console.error(chalk_1.default.red(`Workflow "${name}" not found.`));
            const all = (0, core_1.listWorkflows)(root);
            if (all.length > 0) {
                console.log(chalk_1.default.dim('Available: ' + all.map((w) => w.slug).join(', ')));
            }
            process.exit(1);
        }
        console.log(chalk_1.default.bold.cyan(`\n⚡ /${workflow.slug}\n`));
        if (workflow.description) {
            console.log(chalk_1.default.dim(workflow.description));
            console.log();
        }
        console.log(workflow.content);
        process.exit(0);
    });
    // ─── workflow run ──────────────────────────────────────────────
    wf
        .command('run')
        .description('Trigger a workflow in the agent panel (sends /name)')
        .argument('<name>', 'Workflow name or slug')
        .option('-a, --app <name>', 'Target IDE app', DEFAULT_APP)
        .option('--dry-run', 'Show what would be sent')
        .action((name, options) => {
        const root = getProjectRoot();
        const workflow = (0, core_1.getWorkflow)(root, name);
        if (!workflow) {
            console.error(chalk_1.default.red(`Workflow "${name}" not found.`));
            process.exit(1);
        }
        const command = `/${workflow.slug}`;
        if (options.dryRun) {
            console.log(chalk_1.default.bold.cyan('\n🔍 Dry Run:\n'));
            console.log(`  Command: ${chalk_1.default.green(command)}`);
            console.log(`  App:     ${options.app || DEFAULT_APP}`);
            console.log();
            return;
        }
        if (process.platform !== 'darwin') {
            console.error(chalk_1.default.red('✗ Only supported on macOS'));
            process.exit(1);
        }
        const appName = options.app || DEFAULT_APP;
        console.log(chalk_1.default.dim(`  Triggering ${command} in ${appName}...`));
        try {
            sendToAgent(command, appName);
            console.log(chalk_1.default.green(`✓ Sent ${command} to ${appName}`));
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(chalk_1.default.red(`✗ Failed: ${error.message}`));
            process.exit(1);
        }
    });
    // ─── workflow create ───────────────────────────────────────────
    wf
        .command('create')
        .description('Create a new workflow file')
        .argument('<name>', 'Workflow slug (e.g., deploy, test-all)')
        .argument('<description>', 'Short description')
        .option('--turbo', 'Add // turbo-all annotation')
        .action((name, description, options) => {
        const root = getProjectRoot();
        const wfDir = (0, core_1.getOrCreateWorkflowDir)(root);
        const slug = name.replace(/\.md$/, '');
        const filePath = path.join(wfDir, `${slug}.md`);
        if (fs.existsSync(filePath)) {
            console.error(chalk_1.default.red(`Workflow "${slug}" already exists at ${filePath}`));
            process.exit(1);
        }
        const turboLine = options.turbo ? '\n// turbo-all\n' : '';
        const content = `---
description: ${description}
---
${turboLine}
1. Step one — describe what to do

2. Step two — next action

3. Step three — verification
`;
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(chalk_1.default.green(`✓ Created workflow: ${filePath}`));
        console.log(chalk_1.default.dim(`  Trigger with: bidirection workflow run ${slug}`));
        console.log(chalk_1.default.dim(`  Or in agent:  /${slug}`));
    });
}
//# sourceMappingURL=workflow.js.map