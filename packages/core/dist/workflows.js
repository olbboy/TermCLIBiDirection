"use strict";
/**
 * Workflow & Skill Discovery Utilities
 *
 * Discovers and parses workflow/skill definitions from Antigravity's
 * standard locations: {.agents,.agent,_agents,_agent}/workflows/*.md
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkflows = listWorkflows;
exports.getWorkflow = getWorkflow;
exports.getOrCreateWorkflowDir = getOrCreateWorkflowDir;
exports.listSkills = listSkills;
exports.getSkill = getSkill;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ─── Standard Locations ───────────────────────────────────────────────
const AGENT_DIRS = ['.agents', '.agent', '_agents', '_agent'];
// ─── Workflow Discovery ───────────────────────────────────────────────
/**
 * Find the agent directory containing workflows in a project.
 */
function findAgentDir(projectRoot) {
    for (const dir of AGENT_DIRS) {
        const full = path.join(projectRoot, dir);
        if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
            return full;
        }
    }
    return null;
}
/**
 * Find all workflow directories in a project.
 */
function findWorkflowDirs(projectRoot) {
    const dirs = [];
    for (const dir of AGENT_DIRS) {
        const wfDir = path.join(projectRoot, dir, 'workflows');
        if (fs.existsSync(wfDir) && fs.statSync(wfDir).isDirectory()) {
            dirs.push(wfDir);
        }
    }
    return dirs;
}
/**
 * Parse YAML frontmatter from a markdown file.
 * Returns { description, body }.
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match)
        return { description: '', body: content };
    const frontmatter = match[1];
    const body = match[2];
    // Extract description from YAML
    const descMatch = frontmatter.match(/description:\s*(.+)/);
    const description = descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, '') : '';
    return { description, body };
}
/**
 * List all workflows in a project.
 */
function listWorkflows(projectRoot) {
    const wfDirs = findWorkflowDirs(projectRoot);
    const workflows = [];
    for (const wfDir of wfDirs) {
        const files = fs.readdirSync(wfDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            const filePath = path.join(wfDir, file);
            const raw = fs.readFileSync(filePath, 'utf-8');
            const { description, body } = parseFrontmatter(raw);
            const slug = file.replace(/\.md$/, '');
            workflows.push({
                name: file,
                slug,
                path: filePath,
                description,
                content: body,
                hasTurboAll: raw.includes('// turbo-all'),
            });
        }
    }
    return workflows;
}
/**
 * Read a specific workflow by slug or name.
 */
function getWorkflow(projectRoot, nameOrSlug) {
    const workflows = listWorkflows(projectRoot);
    return workflows.find(w => w.slug === nameOrSlug ||
        w.name === nameOrSlug ||
        w.slug.includes(nameOrSlug)) || null;
}
/**
 * Get the appropriate agent directory for creating new workflows.
 * Creates .agents/workflows/ if none exists.
 */
function getOrCreateWorkflowDir(projectRoot) {
    const existing = findWorkflowDirs(projectRoot);
    if (existing.length > 0)
        return existing[0];
    // Create .agents/workflows/
    const agentDir = findAgentDir(projectRoot);
    const wfDir = agentDir
        ? path.join(agentDir, 'workflows')
        : path.join(projectRoot, '.agents', 'workflows');
    fs.mkdirSync(wfDir, { recursive: true });
    return wfDir;
}
// ─── Skill Discovery ─────────────────────────────────────────────────
/**
 * Find all skill directories in standard locations.
 */
function findSkillDirs(projectRoot) {
    const dirs = [];
    for (const dir of AGENT_DIRS) {
        const skillDir = path.join(projectRoot, dir, 'skills');
        if (fs.existsSync(skillDir) && fs.statSync(skillDir).isDirectory()) {
            dirs.push(skillDir);
        }
    }
    return dirs;
}
/**
 * List all skills in a project.
 */
function listSkills(projectRoot) {
    const skillDirs = findSkillDirs(projectRoot);
    const skills = [];
    for (const skillDir of skillDirs) {
        const entries = fs.readdirSync(skillDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const skillPath = path.join(skillDir, entry.name);
            const skillMd = path.join(skillPath, 'SKILL.md');
            if (!fs.existsSync(skillMd))
                continue;
            const raw = fs.readFileSync(skillMd, 'utf-8');
            const { description, body } = parseFrontmatter(raw);
            skills.push({
                name: entry.name,
                path: skillPath,
                description,
                content: body,
                hasScripts: fs.existsSync(path.join(skillPath, 'scripts')),
                hasExamples: fs.existsSync(path.join(skillPath, 'examples')),
            });
        }
    }
    return skills;
}
/**
 * Read a specific skill by name.
 */
function getSkill(projectRoot, name) {
    const skills = listSkills(projectRoot);
    return skills.find(s => s.name === name || s.name.includes(name)) || null;
}
//# sourceMappingURL=workflows.js.map