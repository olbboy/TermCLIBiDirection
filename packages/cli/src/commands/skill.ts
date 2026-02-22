/**
 * Skill Commands — Browse Antigravity agent skills
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { listSkills, getSkill } from '@bidirection/core';

function getProjectRoot(): string {
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, '.git'))) return dir;
        dir = path.dirname(dir);
    }
    return process.cwd();
}

export function registerSkillCommands(program: Command): void {
    const skill = program
        .command('skill')
        .description('Browse Antigravity agent skills');

    // ─── skill list ─────────────────────────────────────────────────
    skill
        .command('list')
        .description('List available skills in current project')
        .action(() => {
            const root = getProjectRoot();
            const skills = listSkills(root);

            if (skills.length === 0) {
                console.log(chalk.yellow('No skills found.'));
                console.log(chalk.dim(`  Skills live in {.agents,.agent}/skills/<name>/SKILL.md`));
                process.exit(0);
            }

            console.log(chalk.bold.cyan(`\n🎯 Skills (${skills.length}):\n`));
            for (const s of skills) {
                const extras = [
                    s.hasScripts ? '📜scripts' : '',
                    s.hasExamples ? '📚examples' : '',
                ].filter(Boolean).join(' ');

                console.log(`  ${chalk.bold.green(s.name)} ${chalk.dim(extras)}`);
                if (s.description) {
                    console.log(chalk.dim(`    ${s.description}`));
                }
            }
            console.log();
            process.exit(0);
        });

    // ─── skill show ─────────────────────────────────────────────────
    skill
        .command('show')
        .description('Show SKILL.md content for a skill')
        .argument('<name>', 'Skill name')
        .action((name) => {
            const root = getProjectRoot();
            const s = getSkill(root, name);

            if (!s) {
                console.error(chalk.red(`Skill "${name}" not found.`));
                const all = listSkills(root);
                if (all.length > 0) {
                    console.log(chalk.dim('Available: ' + all.map((s: { name: string }) => s.name).join(', ')));
                }
                process.exit(1);
            }

            console.log(chalk.bold.cyan(`\n🎯 ${s.name}\n`));
            if (s.description) {
                console.log(chalk.dim(s.description));
                console.log();
            }
            console.log(s.content);
            process.exit(0);
        });
}
