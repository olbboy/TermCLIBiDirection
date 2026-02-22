/**
 * Antigravity IDE Integration Constants & Utilities
 *
 * Centralized access to Antigravity's filesystem paths:
 * brain artifacts, knowledge items, conversations, and IPC.
 */
export declare const ANTIGRAVITY_PATHS: {
    /** Root data dir: ~/.gemini/antigravity */
    readonly DATA_DIR: string;
    /** Brain artifacts: ~/.gemini/antigravity/brain */
    readonly BRAIN_DIR: string;
    /** Knowledge items: ~/.gemini/antigravity/knowledge */
    readonly KNOWLEDGE_DIR: string;
    /** Conversation protobuf files: ~/.gemini/antigravity/conversations */
    readonly CONVERSATIONS_DIR: string;
    /** App support: ~/Library/Application Support/Antigravity */
    readonly APP_SUPPORT: string;
    /** User extensions: ~/.antigravity/extensions */
    readonly EXTENSIONS_DIR: string;
    /** Playground projects */
    readonly PLAYGROUND_DIR: string;
    /** Browser recordings */
    readonly RECORDINGS_DIR: string;
};
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
export declare function listBrainConversations(): BrainConversation[];
/**
 * Get details of a specific conversation's artifacts.
 */
export declare function getBrainArtifacts(conversationId: string): BrainArtifact[];
/**
 * Read a brain artifact's content.
 */
export declare function readBrainArtifact(conversationId: string, artifactName: string): string | null;
/**
 * Get system-generated log files for a conversation.
 */
export declare function getBrainLogs(conversationId: string): {
    name: string;
    path: string;
    content: string;
}[];
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
export declare function listKnowledgeItems(): KnowledgeItem[];
/**
 * Read a knowledge artifact file.
 */
export declare function readKnowledgeArtifact(knowledgeId: string, artifactPath: string): string | null;
/**
 * Search across all knowledge items for a text pattern.
 */
export declare function searchKnowledge(query: string): {
    knowledgeId: string;
    file: string;
    line: number;
    content: string;
}[];
/**
 * Detect the current conversation ID from the most recently modified brain entry.
 */
export declare function detectCurrentConversation(): string | null;
//# sourceMappingURL=antigravity.d.ts.map