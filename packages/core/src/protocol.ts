/**
 * BiDirection JSON-RPC 2.0 Protocol
 * 
 * Defines the message format and method types for bidirectional 
 * communication between Terminal CLI and IDE Extension.
 */

// ─── JSON-RPC 2.0 Base Types ─────────────────────────────────────────

export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params?: Record<string, unknown>;
}

export interface JsonRpcNotification {
    jsonrpc: '2.0';
    method: string;
    params?: Record<string, unknown>;
}

export interface JsonRpcSuccessResponse {
    jsonrpc: '2.0';
    id: number | string;
    result: unknown;
}

export interface JsonRpcErrorResponse {
    jsonrpc: '2.0';
    id: number | string;
    error: {
        code: number;
        message: string;
        data?: unknown;
    };
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;
export type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

// ─── Standard Error Codes ─────────────────────────────────────────────

export const ErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    // Custom error codes (application-specific)
    NO_ACTIVE_EDITOR: -32001,
    FILE_NOT_FOUND: -32002,
    PERMISSION_DENIED: -32003,
    TIMEOUT: -32004,
} as const;

// ─── Protocol Methods ─────────────────────────────────────────────────

export const Methods = {
    // Editor operations (CLI → IDE)
    EDITOR_GET_TEXT: 'editor/getText',
    EDITOR_GET_SELECTION: 'editor/getSelection',
    EDITOR_SET_CURSOR: 'editor/setCursor',
    EDITOR_APPLY_EDIT: 'editor/applyEdit',
    EDITOR_HIGHLIGHT: 'editor/highlight',

    // Workspace operations (CLI → IDE)
    WORKSPACE_OPEN_FILE: 'workspace/openFile',
    WORKSPACE_GET_DIAGNOSTICS: 'workspace/getDiagnostics',
    WORKSPACE_GET_OPEN_FILES: 'workspace/getOpenFiles',

    // Command execution (CLI → IDE)
    COMMAND_EXECUTE: 'command/execute',

    // Terminal operations (CLI → IDE)
    TERMINAL_SEND_TEXT: 'terminal/sendText',

    // Window operations (CLI → IDE)
    WINDOW_SHOW_MESSAGE: 'window/showMessage',
    WINDOW_SHOW_QUICK_PICK: 'window/showQuickPick',

    // Notifications (IDE → CLI)
    EDITOR_ON_CHANGE: 'editor/onChange',
    EDITOR_ON_SAVE: 'editor/onSave',
    EDITOR_ON_ACTIVE_CHANGE: 'editor/onActiveChange',

    // Meta
    PING: 'ping',
    GET_INFO: 'getInfo',
} as const;

// ─── Method Parameter & Result Types ──────────────────────────────────

// editor/getText
export interface GetTextParams {
    uri?: string; // If omitted, uses active editor
}
export interface GetTextResult {
    text: string;
    uri: string;
    languageId: string;
    lineCount: number;
}

// editor/getSelection
export interface GetSelectionParams {
    uri?: string;
}
export interface GetSelectionResult {
    text: string;
    uri: string;
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
}

// editor/setCursor
export interface SetCursorParams {
    uri?: string;
    line: number;
    character: number;
}
export interface SetCursorResult {
    success: boolean;
}

// editor/applyEdit
export interface ApplyEditParams {
    uri: string;
    edits: Array<{
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
        newText: string;
    }>;
}
export interface ApplyEditResult {
    success: boolean;
    uri: string;
}

// editor/highlight
export interface HighlightParams {
    uri?: string;
    startLine: number;
    endLine: number;
    color?: string; // CSS color, default: yellow highlight
}
export interface HighlightResult {
    success: boolean;
}

// workspace/openFile
export interface OpenFileParams {
    uri: string;
    line?: number;
    character?: number;
    preview?: boolean;
}
export interface OpenFileResult {
    success: boolean;
    uri: string;
}

// workspace/getDiagnostics
export interface GetDiagnosticsParams {
    uri?: string; // If omitted, returns all diagnostics
}
export interface DiagnosticItem {
    uri: string;
    line: number;
    character: number;
    endLine: number;
    endCharacter: number;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'hint';
    source?: string;
}
export interface GetDiagnosticsResult {
    diagnostics: DiagnosticItem[];
}

// workspace/getOpenFiles
export interface GetOpenFilesResult {
    files: Array<{
        uri: string;
        isActive: boolean;
        isDirty: boolean;
        languageId: string;
    }>;
}

// command/execute
export interface ExecuteCommandParams {
    command: string;
    args?: unknown[];
}
export interface ExecuteCommandResult {
    result: unknown;
}

// terminal/sendText
export interface SendTextParams {
    text: string;
    terminalName?: string;
    addNewLine?: boolean;
}
export interface SendTextResult {
    success: boolean;
}

// window/showMessage
export interface ShowMessageParams {
    message: string;
    type?: 'info' | 'warning' | 'error';
    actions?: string[];
}
export interface ShowMessageResult {
    selectedAction?: string;
}

// window/showQuickPick
export interface ShowQuickPickParams {
    items: Array<{
        label: string;
        description?: string;
        detail?: string;
    }>;
    title?: string;
    placeholder?: string;
}
export interface ShowQuickPickResult {
    selectedItem?: string;
}

// Notifications (IDE → CLI)
export interface EditorChangeNotification {
    uri: string;
    text: string;
    changes: Array<{
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
        text: string;
    }>;
}

export interface EditorSaveNotification {
    uri: string;
}

export interface EditorActiveChangeNotification {
    uri: string;
    languageId: string;
}

// ping
export interface PingResult {
    pong: true;
    timestamp: number;
    version: string;
}

// getInfo
export interface GetInfoResult {
    name: string;
    version: string;
    ide: string;
    ideVersion: string;
    socketPath: string;
    pid: number;
    workspaceFolders: string[];
}

// ─── Helper Functions ─────────────────────────────────────────────────

let _nextId = 1;

export function createRequest(method: string, params?: Record<string, unknown>): JsonRpcRequest {
    return {
        jsonrpc: '2.0',
        id: _nextId++,
        method,
        params,
    };
}

export function createNotification(method: string, params?: Record<string, unknown>): JsonRpcNotification {
    return {
        jsonrpc: '2.0',
        method,
        params,
    };
}

export function createSuccessResponse(id: number | string, result: unknown): JsonRpcSuccessResponse {
    return {
        jsonrpc: '2.0',
        id,
        result,
    };
}

export function createErrorResponse(id: number | string, code: number, message: string, data?: unknown): JsonRpcErrorResponse {
    return {
        jsonrpc: '2.0',
        id,
        error: { code, message, data },
    };
}

export function isRequest(msg: JsonRpcMessage): msg is JsonRpcRequest {
    return 'method' in msg && 'id' in msg;
}

export function isNotification(msg: JsonRpcMessage): msg is JsonRpcNotification {
    return 'method' in msg && !('id' in msg);
}

export function isResponse(msg: JsonRpcMessage): msg is JsonRpcResponse {
    return 'id' in msg && !('method' in msg);
}

export function isErrorResponse(msg: JsonRpcResponse): msg is JsonRpcErrorResponse {
    return 'error' in msg;
}
