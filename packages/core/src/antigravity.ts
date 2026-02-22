/**
 * Antigravity IDE Integration Constants & Utilities
 * 
 * Centralized access to Antigravity's filesystem paths:
 * brain artifacts, knowledge items, conversations, and IPC.
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// ─── Base Paths ───────────────────────────────────────────────────────

const HOME = os.homedir();

export const ANTIGRAVITY_PATHS = {
    /** Root data dir: ~/.gemini/antigravity */
    DATA_DIR: path.join(HOME, '.gemini', 'antigravity'),
    /** Brain artifacts: ~/.gemini/antigravity/brain */
    BRAIN_DIR: path.join(HOME, '.gemini', 'antigravity', 'brain'),
    /** Knowledge items: ~/.gemini/antigravity/knowledge */
    KNOWLEDGE_DIR: path.join(HOME, '.gemini', 'antigravity', 'knowledge'),
    /** Conversation protobuf files: ~/.gemini/antigravity/conversations */
    CONVERSATIONS_DIR: path.join(HOME, '.gemini', 'antigravity', 'conversations'),
    /** App support: ~/Library/Application Support/Antigravity */
    APP_SUPPORT: path.join(HOME, 'Library', 'Application Support', 'Antigravity'),
    /** User extensions: ~/.antigravity/extensions */
    EXTENSIONS_DIR: path.join(HOME, '.antigravity', 'extensions'),
    /** Playground projects */
    PLAYGROUND_DIR: path.join(HOME, '.gemini', 'antigravity', 'playground'),
    /** Browser recordings */
    RECORDINGS_DIR: path.join(HOME, '.gemini', 'antigravity', 'browser_recordings'),
} as const;

// ─── Brain Artifacts ──────────────────────────────────────────────────

export interface BrainConversation {
    id: string;
    path: string;
    artifacts: string[];
    hasTask: boolean;
    hasPlan: boolean;
    hasWalkthrough: boolean;
    modifiedAt: Date;
}

export interface BrainArtifact {
    name: string;
    path: string;
    size: number;
    modifiedAt: Date;
    metadata?: Record<string, unknown>;
    versions: number;
}

/**
 * List all conversations in the brain directory.
 */
export function listBrainConversations(): BrainConversation[] {
    const brainDir = ANTIGRAVITY_PATHS.BRAIN_DIR;
    if (!fs.existsSync(brainDir)) return [];

    const entries = fs.readdirSync(brainDir, { withFileTypes: true });
    const conversations: BrainConversation[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        // UUID-like directory names
        if (!/^[0-9a-f]{8}-/.test(entry.name)) continue;

        const convPath = path.join(brainDir, entry.name);
        const files = fs.readdirSync(convPath).filter(f => !f.startsWith('.'));
        const mdFiles = files.filter(f => f.endsWith('.md') && !f.includes('.resolved') && !f.includes('.metadata'));

        let modifiedAt = new Date(0);
        try {
            const stat = fs.statSync(convPath);
            modifiedAt = stat.mtime;
        } catch { }

        conversations.push({
            id: entry.name,
            path: convPath,
            artifacts: mdFiles,
            hasTask: mdFiles.includes('task.md'),
            hasPlan: mdFiles.includes('implementation_plan.md'),
            hasWalkthrough: mdFiles.includes('walkthrough.md'),
            modifiedAt,
        });
    }

    // Sort by most recently modified first
    conversations.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
    return conversations;
}

/**
 * Get details of a specific conversation's artifacts.
 */
export function getBrainArtifacts(conversationId: string): BrainArtifact[] {
    const convPath = path.join(ANTIGRAVITY_PATHS.BRAIN_DIR, conversationId);
    if (!fs.existsSync(convPath)) return [];

    const files = fs.readdirSync(convPath);
    const artifacts: BrainArtifact[] = [];

    const mdFiles = files.filter(f => f.endsWith('.md') && !f.includes('.resolved') && !f.includes('.metadata'));

    for (const mdFile of mdFiles) {
        const fullPath = path.join(convPath, mdFile);
        const stat = fs.statSync(fullPath);

        // Count versions (.resolved.0, .resolved.1, etc.)
        const resolvedFiles = files.filter(f => f.startsWith(mdFile + '.resolved'));
        const versions = resolvedFiles.length;

        // Read metadata if available
        let metadata: Record<string, unknown> | undefined;
        const metaPath = path.join(convPath, mdFile + '.metadata.json');
        if (fs.existsSync(metaPath)) {
            try {
                metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            } catch { }
        }

        artifacts.push({
            name: mdFile,
            path: fullPath,
            size: stat.size,
            modifiedAt: stat.mtime,
            metadata,
            versions,
        });
    }

    return artifacts;
}

/**
 * Read a brain artifact's content.
 */
export function readBrainArtifact(conversationId: string, artifactName: string): string | null {
    const filePath = path.join(ANTIGRAVITY_PATHS.BRAIN_DIR, conversationId, artifactName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Get system-generated log files for a conversation.
 */
export function getBrainLogs(conversationId: string): { name: string; path: string; content: string }[] {
    const logsDir = path.join(ANTIGRAVITY_PATHS.BRAIN_DIR, conversationId, '.system_generated', 'logs');
    if (!fs.existsSync(logsDir)) return [];

    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.txt'));
    return files.map(f => ({
        name: f.replace('.txt', ''),
        path: path.join(logsDir, f),
        content: fs.readFileSync(path.join(logsDir, f), 'utf-8'),
    }));
}

// ─── Knowledge Items ──────────────────────────────────────────────────

export interface KnowledgeItem {
    id: string;
    path: string;
    summary?: string;
    lastAccessed?: string;
    artifactPaths: string[];
    metadata?: Record<string, unknown>;
}

/**
 * List all knowledge items.
 */
export function listKnowledgeItems(): KnowledgeItem[] {
    const knowledgeDir = ANTIGRAVITY_PATHS.KNOWLEDGE_DIR;
    if (!fs.existsSync(knowledgeDir)) return [];

    const entries = fs.readdirSync(knowledgeDir, { withFileTypes: true });
    const items: KnowledgeItem[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const itemPath = path.join(knowledgeDir, entry.name);
        let metadata: Record<string, unknown> | undefined;
        let summary: string | undefined;
        let lastAccessed: string | undefined;

        // Read metadata.json
        const metaPath = path.join(itemPath, 'metadata.json');
        if (fs.existsSync(metaPath)) {
            try {
                metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                summary = metadata?.summary as string;
                lastAccessed = metadata?.lastAccessed as string;
            } catch { }
        }

        // List artifacts
        const artifactsDir = path.join(itemPath, 'artifacts');
        let artifactPaths: string[] = [];
        if (fs.existsSync(artifactsDir)) {
            artifactPaths = findAllFiles(artifactsDir);
        }

        items.push({
            id: entry.name,
            path: itemPath,
            summary,
            lastAccessed,
            artifactPaths,
            metadata,
        });
    }

    return items;
}

/**
 * Read a knowledge artifact file.
 */
export function readKnowledgeArtifact(knowledgeId: string, artifactPath: string): string | null {
    const fullPath = path.join(ANTIGRAVITY_PATHS.KNOWLEDGE_DIR, knowledgeId, 'artifacts', artifactPath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Search across all knowledge items for a text pattern.
 */
export function searchKnowledge(query: string): { knowledgeId: string; file: string; line: number; content: string }[] {
    const results: { knowledgeId: string; file: string; line: number; content: string }[] = [];
    const items = listKnowledgeItems();
    const queryLower = query.toLowerCase();

    for (const item of items) {
        // Search metadata summary
        if (item.summary?.toLowerCase().includes(queryLower)) {
            results.push({
                knowledgeId: item.id,
                file: 'metadata.json',
                line: 0,
                content: item.summary,
            });
        }

        // Search artifact files
        for (const artPath of item.artifactPaths) {
            const fullPath = path.join(item.path, 'artifacts', artPath);
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].toLowerCase().includes(queryLower)) {
                        results.push({
                            knowledgeId: item.id,
                            file: artPath,
                            line: i + 1,
                            content: lines[i].trim(),
                        });
                    }
                }
            } catch { }
        }
    }

    return results.slice(0, 50); // Cap at 50 results
}

// ─── Helpers ──────────────────────────────────────────────────────────

function findAllFiles(dir: string, basePath = ''): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const relPath = basePath ? path.join(basePath, entry.name) : entry.name;
        if (entry.isDirectory()) {
            results.push(...findAllFiles(path.join(dir, entry.name), relPath));
        } else {
            results.push(relPath);
        }
    }
    return results;
}

/**
 * Detect the current conversation ID from the most recently modified brain entry.
 */
export function detectCurrentConversation(): string | null {
    const conversations = listBrainConversations();
    if (conversations.length === 0) return null;
    return conversations[0].id; // Most recently modified
}
