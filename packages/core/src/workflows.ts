/**
 * Workflow & Skill Discovery Utilities
 * 
 * Discovers and parses workflow/skill definitions from Antigravity's
 * standard locations: {.agents,.agent,_agents,_agent}/workflows/*.md
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Standard Locations ───────────────────────────────────────────────

const AGENT_DIRS = ['.agents', '.agent', '_agents', '_agent'];

export interface WorkflowFile {
    name: string;
    slug: string;          // filename without .md
    path: string;
    description: string;   // from YAML frontmatter
    content: string;       // markdown body
    hasTurboAll: boolean;
}

export interface SkillFile {
    name: string;
    path: string;
    description: string;
    content: string;
    hasScripts: boolean;
    hasExamples: boolean;
}

// ─── Workflow Discovery ───────────────────────────────────────────────

/**
 * Find the agent directory containing workflows in a project.
 */
function findAgentDir(projectRoot: string): string | null {
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
function findWorkflowDirs(projectRoot: string): string[] {
    const dirs: string[] = [];
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
function parseFrontmatter(content: string): { description: string; body: string } {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) return { description: '', body: content };

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
export function listWorkflows(projectRoot: string): WorkflowFile[] {
    const wfDirs = findWorkflowDirs(projectRoot);
    const workflows: WorkflowFile[] = [];

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
export function getWorkflow(projectRoot: string, nameOrSlug: string): WorkflowFile | null {
    const workflows = listWorkflows(projectRoot);
    return workflows.find(w =>
        w.slug === nameOrSlug ||
        w.name === nameOrSlug ||
        w.slug.includes(nameOrSlug)
    ) || null;
}

/**
 * Get the appropriate agent directory for creating new workflows.
 * Creates .agents/workflows/ if none exists.
 */
export function getOrCreateWorkflowDir(projectRoot: string): string {
    const existing = findWorkflowDirs(projectRoot);
    if (existing.length > 0) return existing[0];

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
function findSkillDirs(projectRoot: string): string[] {
    const dirs: string[] = [];
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
export function listSkills(projectRoot: string): SkillFile[] {
    const skillDirs = findSkillDirs(projectRoot);
    const skills: SkillFile[] = [];

    for (const skillDir of skillDirs) {
        const entries = fs.readdirSync(skillDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const skillPath = path.join(skillDir, entry.name);
            const skillMd = path.join(skillPath, 'SKILL.md');

            if (!fs.existsSync(skillMd)) continue;

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
export function getSkill(projectRoot: string, name: string): SkillFile | null {
    const skills = listSkills(projectRoot);
    return skills.find(s =>
        s.name === name || s.name.includes(name)
    ) || null;
}
