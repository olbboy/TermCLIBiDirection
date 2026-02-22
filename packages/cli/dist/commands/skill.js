"use strict";
/**
 * Skill Commands — Browse Antigravity agent skills
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
exports.registerSkillCommands = registerSkillCommands;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core_1 = require("@bidirection/core");
function getProjectRoot() {
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, '.git')))
            return dir;
        dir = path.dirname(dir);
    }
    return process.cwd();
}
function registerSkillCommands(program) {
    const skill = program
        .command('skill')
        .description('Browse Antigravity agent skills');
    // ─── skill list ─────────────────────────────────────────────────
    skill
        .command('list')
        .description('List available skills in current project')
        .action(() => {
        const root = getProjectRoot();
        const skills = (0, core_1.listSkills)(root);
        if (skills.length === 0) {
            console.log(chalk_1.default.yellow('No skills found.'));
            console.log(chalk_1.default.dim(`  Skills live in {.agents,.agent}/skills/<name>/SKILL.md`));
            process.exit(0);
        }
        console.log(chalk_1.default.bold.cyan(`\n🎯 Skills (${skills.length}):\n`));
        for (const s of skills) {
            const extras = [
                s.hasScripts ? '📜scripts' : '',
                s.hasExamples ? '📚examples' : '',
            ].filter(Boolean).join(' ');
            console.log(`  ${chalk_1.default.bold.green(s.name)} ${chalk_1.default.dim(extras)}`);
            if (s.description) {
                console.log(chalk_1.default.dim(`    ${s.description}`));
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
        const s = (0, core_1.getSkill)(root, name);
        if (!s) {
            console.error(chalk_1.default.red(`Skill "${name}" not found.`));
            const all = (0, core_1.listSkills)(root);
            if (all.length > 0) {
                console.log(chalk_1.default.dim('Available: ' + all.map((s) => s.name).join(', ')));
            }
            process.exit(1);
        }
        console.log(chalk_1.default.bold.cyan(`\n🎯 ${s.name}\n`));
        if (s.description) {
            console.log(chalk_1.default.dim(s.description));
            console.log();
        }
        console.log(s.content);
        process.exit(0);
    });
}
//# sourceMappingURL=skill.js.map