"use strict";
/**
 * Workspace Handlers
 *
 * Handles workspace-related JSON-RPC requests:
 * - workspace/openFile
 * - workspace/getDiagnostics
 * - workspace/getOpenFiles
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
exports.registerWorkspaceHandlers = registerWorkspaceHandlers;
const vscode = __importStar(require("vscode"));
const core_1 = require("@bidirection/core");
const severityMap = {
    [vscode.DiagnosticSeverity.Error]: 'error',
    [vscode.DiagnosticSeverity.Warning]: 'warning',
    [vscode.DiagnosticSeverity.Information]: 'info',
    [vscode.DiagnosticSeverity.Hint]: 'hint',
};
function registerWorkspaceHandlers(server) {
    // workspace/openFile
    server.registerHandler(core_1.Methods.WORKSPACE_OPEN_FILE, async (params) => {
        const p = params;
        const uri = vscode.Uri.file(p.uri);
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc, {
            preview: p.preview !== false,
        });
        // Navigate to specific line/character if provided
        if (p.line !== undefined) {
            const line = p.line;
            const character = p.character || 0;
            const position = new vscode.Position(line, character);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        }
        const result = { success: true, uri: p.uri };
        return result;
    });
    // workspace/getDiagnostics
    server.registerHandler(core_1.Methods.WORKSPACE_GET_DIAGNOSTICS, async (params) => {
        const p = (params || {});
        const allDiagnostics = vscode.languages.getDiagnostics();
        const diagnosticItems = [];
        for (const [uri, diagnostics] of allDiagnostics) {
            // Filter by URI if specified
            if (p.uri && uri.fsPath !== p.uri) {
                continue;
            }
            for (const diag of diagnostics) {
                diagnosticItems.push({
                    uri: uri.fsPath,
                    line: diag.range.start.line,
                    character: diag.range.start.character,
                    endLine: diag.range.end.line,
                    endCharacter: diag.range.end.character,
                    message: diag.message,
                    severity: severityMap[diag.severity] || 'info',
                    source: diag.source,
                });
            }
        }
        const result = { diagnostics: diagnosticItems };
        return result;
    });
    // workspace/getOpenFiles
    server.registerHandler(core_1.Methods.WORKSPACE_GET_OPEN_FILES, async () => {
        const activeUri = vscode.window.activeTextEditor?.document.uri.fsPath;
        const files = [];
        // Use tabGroups API for comprehensive list
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputText) {
                    const uri = tab.input.uri.fsPath;
                    let isDirty = false;
                    let languageId = 'unknown';
                    // Try to get document info
                    try {
                        const doc = vscode.workspace.textDocuments.find((d) => d.uri.fsPath === uri);
                        if (doc) {
                            isDirty = doc.isDirty;
                            languageId = doc.languageId;
                        }
                    }
                    catch {
                        // Document may not be loaded
                    }
                    files.push({
                        uri,
                        isActive: uri === activeUri,
                        isDirty,
                        languageId,
                    });
                }
            }
        }
        const result = { files };
        return result;
    });
}
//# sourceMappingURL=workspace.js.map