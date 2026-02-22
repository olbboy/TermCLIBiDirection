/**
 * Workflow Commands — Manage and trigger Antigravity workflows
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
    listWorkflows,
    getWorkflow,
    getOrCreateWorkflowDir,
} from '@bidirection/core';

const DEFAULT_APP = 'Antigravity';

function getProjectRoot(): string {
    // Walk up to find a git root or use cwd
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, '.git'))) return dir;
        dir = path.dirname(dir);
    }
    return process.cwd();
}

function sendToAgent(text: string, appName: string): void {
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

    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
        encoding: 'utf-8',
        timeout: 15000,
    });
}

export function registerWorkflowCommands(program: Command): void {
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
            const workflows = listWorkflows(root);

            if (workflows.length === 0) {
                console.log(chalk.yellow('No workflows found.'));
                console.log(chalk.dim(`  Create one: bidirection workflow create <name> "<description>"`));
                process.exit(0);
            }

            console.log(chalk.bold.cyan(`\n⚡ Workflows (${workflows.length}):\n`));
            for (const wf of workflows) {
                const turbo = wf.hasTurboAll ? chalk.green(' ⚡turbo') : '';
                console.log(`  ${chalk.green('/' + wf.slug)}${turbo}`);
                if (wf.description) {
                    console.log(chalk.dim(`    ${wf.description}`));
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
            const workflow = getWorkflow(root, name);

            if (!workflow) {
                console.error(chalk.red(`Workflow "${name}" not found.`));
                const all = listWorkflows(root);
                if (all.length > 0) {
                    console.log(chalk.dim('Available: ' + all.map((w: { slug: string }) => w.slug).join(', ')));
                }
                process.exit(1);
            }

            console.log(chalk.bold.cyan(`\n⚡ /${workflow.slug}\n`));
            if (workflow.description) {
                console.log(chalk.dim(workflow.description));
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
            const workflow = getWorkflow(root, name);

            if (!workflow) {
                console.error(chalk.red(`Workflow "${name}" not found.`));
                process.exit(1);
            }

            const command = `/${workflow.slug}`;

            if (options.dryRun) {
                console.log(chalk.bold.cyan('\n🔍 Dry Run:\n'));
                console.log(`  Command: ${chalk.green(command)}`);
                console.log(`  App:     ${options.app || DEFAULT_APP}`);
                console.log();
                return;
            }

            if (process.platform !== 'darwin') {
                console.error(chalk.red('✗ Only supported on macOS'));
                process.exit(1);
            }

            const appName = options.app || DEFAULT_APP;
            console.log(chalk.dim(`  Triggering ${command} in ${appName}...`));

            try {
                sendToAgent(command, appName);
                console.log(chalk.green(`✓ Sent ${command} to ${appName}`));
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error(chalk.red(`✗ Failed: ${error.message}`));
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
            const wfDir = getOrCreateWorkflowDir(root);
            const slug = name.replace(/\.md$/, '');
            const filePath = path.join(wfDir, `${slug}.md`);

            if (fs.existsSync(filePath)) {
                console.error(chalk.red(`Workflow "${slug}" already exists at ${filePath}`));
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
            console.log(chalk.green(`✓ Created workflow: ${filePath}`));
            console.log(chalk.dim(`  Trigger with: bidirection workflow run ${slug}`));
            console.log(chalk.dim(`  Or in agent:  /${slug}`));
        });
}
