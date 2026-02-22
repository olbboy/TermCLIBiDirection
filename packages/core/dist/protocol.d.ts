/**
 * BiDirection JSON-RPC 2.0 Protocol
 *
 * Defines the message format and method types for bidirectional
 * communication between Terminal CLI and IDE Extension.
 */
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
export declare const ErrorCodes: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly NO_ACTIVE_EDITOR: -32001;
    readonly FILE_NOT_FOUND: -32002;
    readonly PERMISSION_DENIED: -32003;
    readonly TIMEOUT: -32004;
};
export declare const Methods: {
    readonly EDITOR_GET_TEXT: "editor/getText";
    readonly EDITOR_GET_SELECTION: "editor/getSelection";
    readonly EDITOR_SET_CURSOR: "editor/setCursor";
    readonly EDITOR_APPLY_EDIT: "editor/applyEdit";
    readonly EDITOR_HIGHLIGHT: "editor/highlight";
    readonly WORKSPACE_OPEN_FILE: "workspace/openFile";
    readonly WORKSPACE_GET_DIAGNOSTICS: "workspace/getDiagnostics";
    readonly WORKSPACE_GET_OPEN_FILES: "workspace/getOpenFiles";
    readonly COMMAND_EXECUTE: "command/execute";
    readonly TERMINAL_SEND_TEXT: "terminal/sendText";
    readonly WINDOW_SHOW_MESSAGE: "window/showMessage";
    readonly WINDOW_SHOW_QUICK_PICK: "window/showQuickPick";
    readonly EDITOR_ON_CHANGE: "editor/onChange";
    readonly EDITOR_ON_SAVE: "editor/onSave";
    readonly EDITOR_ON_ACTIVE_CHANGE: "editor/onActiveChange";
    readonly PING: "ping";
    readonly GET_INFO: "getInfo";
};
export interface GetTextParams {
    uri?: string;
}
export interface GetTextResult {
    text: string;
    uri: string;
    languageId: string;
    lineCount: number;
}
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
export interface SetCursorParams {
    uri?: string;
    line: number;
    character: number;
}
export interface SetCursorResult {
    success: boolean;
}
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
export interface HighlightParams {
    uri?: string;
    startLine: number;
    endLine: number;
    color?: string;
}
export interface HighlightResult {
    success: boolean;
}
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
export interface GetDiagnosticsParams {
    uri?: string;
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
export interface GetOpenFilesResult {
    files: Array<{
        uri: string;
        isActive: boolean;
        isDirty: boolean;
        languageId: string;
    }>;
}
export interface ExecuteCommandParams {
    command: string;
    args?: unknown[];
}
export interface ExecuteCommandResult {
    result: unknown;
}
export interface SendTextParams {
    text: string;
    terminalName?: string;
    addNewLine?: boolean;
}
export interface SendTextResult {
    success: boolean;
}
export interface ShowMessageParams {
    message: string;
    type?: 'info' | 'warning' | 'error';
    actions?: string[];
}
export interface ShowMessageResult {
    selectedAction?: string;
}
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
export interface PingResult {
    pong: true;
    timestamp: number;
    version: string;
}
export interface GetInfoResult {
    name: string;
    version: string;
    ide: string;
    ideVersion: string;
    socketPath: string;
    pid: number;
    workspaceFolders: string[];
}
export declare function createRequest(method: string, params?: Record<string, unknown>): JsonRpcRequest;
export declare function createNotification(method: string, params?: Record<string, unknown>): JsonRpcNotification;
export declare function createSuccessResponse(id: number | string, result: unknown): JsonRpcSuccessResponse;
export declare function createErrorResponse(id: number | string, code: number, message: string, data?: unknown): JsonRpcErrorResponse;
export declare function isRequest(msg: JsonRpcMessage): msg is JsonRpcRequest;
export declare function isNotification(msg: JsonRpcMessage): msg is JsonRpcNotification;
export declare function isResponse(msg: JsonRpcMessage): msg is JsonRpcResponse;
export declare function isErrorResponse(msg: JsonRpcResponse): msg is JsonRpcErrorResponse;
//# sourceMappingURL=protocol.d.ts.map