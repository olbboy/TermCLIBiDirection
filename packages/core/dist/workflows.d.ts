/**
 * Workflow & Skill Discovery Utilities
 *
 * Discovers and parses workflow/skill definitions from Antigravity's
 * standard locations: {.agents,.agent,_agents,_agent}/workflows/*.md
 */
export interface WorkflowFile {
    name: string;
    slug: string;
    path: string;
    description: string;
    content: string;
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
/**
 * List all workflows in a project.
 */
export declare function listWorkflows(projectRoot: string): WorkflowFile[];
/**
 * Read a specific workflow by slug or name.
 */
export declare function getWorkflow(projectRoot: string, nameOrSlug: string): WorkflowFile | null;
/**
 * Get the appropriate agent directory for creating new workflows.
 * Creates .agents/workflows/ if none exists.
 */
export declare function getOrCreateWorkflowDir(projectRoot: string): string;
/**
 * List all skills in a project.
 */
export declare function listSkills(projectRoot: string): SkillFile[];
/**
 * Read a specific skill by name.
 */
export declare function getSkill(projectRoot: string, name: string): SkillFile | null;
//# sourceMappingURL=workflows.d.ts.map