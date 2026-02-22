"use strict";
/**
 * BiDirection JSON-RPC 2.0 Protocol
 *
 * Defines the message format and method types for bidirectional
 * communication between Terminal CLI and IDE Extension.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Methods = exports.ErrorCodes = void 0;
exports.createRequest = createRequest;
exports.createNotification = createNotification;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.isRequest = isRequest;
exports.isNotification = isNotification;
exports.isResponse = isResponse;
exports.isErrorResponse = isErrorResponse;
// ─── Standard Error Codes ─────────────────────────────────────────────
exports.ErrorCodes = {
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
};
// ─── Protocol Methods ─────────────────────────────────────────────────
exports.Methods = {
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
};
// ─── Helper Functions ─────────────────────────────────────────────────
let _nextId = 1;
function createRequest(method, params) {
    return {
        jsonrpc: '2.0',
        id: _nextId++,
        method,
        params,
    };
}
function createNotification(method, params) {
    return {
        jsonrpc: '2.0',
        method,
        params,
    };
}
function createSuccessResponse(id, result) {
    return {
        jsonrpc: '2.0',
        id,
        result,
    };
}
function createErrorResponse(id, code, message, data) {
    return {
        jsonrpc: '2.0',
        id,
        error: { code, message, data },
    };
}
function isRequest(msg) {
    return 'method' in msg && 'id' in msg;
}
function isNotification(msg) {
    return 'method' in msg && !('id' in msg);
}
function isResponse(msg) {
    return 'id' in msg && !('method' in msg);
}
function isErrorResponse(msg) {
    return 'error' in msg;
}
//# sourceMappingURL=protocol.js.map