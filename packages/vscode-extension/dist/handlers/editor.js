"use strict";
/**
 * Editor Handlers
 *
 * Handles editor-related JSON-RPC requests:
 * - editor/getText
 * - editor/getSelection
 * - editor/setCursor
 * - editor/applyEdit
 * - editor/highlight
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
exports.registerEditorHandlers = registerEditorHandlers;
exports.disposeEditorHandlers = disposeEditorHandlers;
const vscode = __importStar(require("vscode"));
const core_1 = require("@bidirection/core");
// Decoration type for highlighting
let highlightDecoration = null;
function getHighlightDecoration(color) {
    if (highlightDecoration) {
        highlightDecoration.dispose();
    }
    highlightDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: color || 'rgba(255, 255, 0, 0.3)',
        isWholeLine: true,
        overviewRulerColor: color || 'rgba(255, 255, 0, 0.7)',
        overviewRulerLane: vscode.OverviewRulerLane.Full,
    });
    return highlightDecoration;
}
function requireActiveEditor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        const err = new Error('No active editor');
        err.code = core_1.ErrorCodes.NO_ACTIVE_EDITOR;
        throw err;
    }
    return editor;
}
function registerEditorHandlers(server) {
    const disposables = [];
    // editor/getText
    server.registerHandler(core_1.Methods.EDITOR_GET_TEXT, async (params) => {
        const p = (params || {});
        let doc;
        if (p.uri) {
            doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
        }
        else {
            const editor = requireActiveEditor();
            doc = editor.document;
        }
        const result = {
            text: doc.getText(),
            uri: doc.uri.fsPath,
            languageId: doc.languageId,
            lineCount: doc.lineCount,
        };
        return result;
    });
    // editor/getSelection
    server.registerHandler(core_1.Methods.EDITOR_GET_SELECTION, async (params) => {
        const p = (params || {});
        const editor = requireActiveEditor();
        if (p.uri && editor.document.uri.fsPath !== p.uri) {
            throw new Error(`Active editor (${editor.document.uri.fsPath}) doesn't match requested URI (${p.uri})`);
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        const result = {
            text,
            uri: editor.document.uri.fsPath,
            startLine: selection.start.line,
            startCharacter: selection.start.character,
            endLine: selection.end.line,
            endCharacter: selection.end.character,
        };
        return result;
    });
    // editor/setCursor
    server.registerHandler(core_1.Methods.EDITOR_SET_CURSOR, async (params) => {
        const p = params;
        let editor;
        if (p.uri) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
            editor = await vscode.window.showTextDocument(doc);
        }
        else {
            editor = requireActiveEditor();
        }
        const position = new vscode.Position(p.line, p.character);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        const result = { success: true };
        return result;
    });
    // editor/applyEdit
    server.registerHandler(core_1.Methods.EDITOR_APPLY_EDIT, async (params) => {
        const p = params;
        const workspaceEdit = new vscode.WorkspaceEdit();
        const uri = vscode.Uri.file(p.uri);
        for (const edit of p.edits) {
            const range = new vscode.Range(new vscode.Position(edit.startLine, edit.startCharacter), new vscode.Position(edit.endLine, edit.endCharacter));
            workspaceEdit.replace(uri, range, edit.newText);
        }
        const success = await vscode.workspace.applyEdit(workspaceEdit);
        const result = { success, uri: p.uri };
        return result;
    });
    // editor/highlight
    server.registerHandler(core_1.Methods.EDITOR_HIGHLIGHT, async (params) => {
        const p = params;
        let editor;
        if (p.uri) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
            editor = await vscode.window.showTextDocument(doc);
        }
        else {
            editor = requireActiveEditor();
        }
        const decoration = getHighlightDecoration(p.color);
        const range = new vscode.Range(new vscode.Position(p.startLine, 0), new vscode.Position(p.endLine, Number.MAX_SAFE_INTEGER));
        editor.setDecorations(decoration, [range]);
        // Also select and reveal the range
        editor.selection = new vscode.Selection(new vscode.Position(p.startLine, 0), new vscode.Position(p.endLine, Number.MAX_SAFE_INTEGER));
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        const result = { success: true };
        return result;
    });
    // Subscribe to editor change events and broadcast to clients
    disposables.push(vscode.workspace.onDidChangeTextDocument((e) => {
        server.broadcast(core_1.Methods.EDITOR_ON_CHANGE, {
            uri: e.document.uri.fsPath,
            changes: e.contentChanges.map((c) => ({
                startLine: c.range.start.line,
                startCharacter: c.range.start.character,
                endLine: c.range.end.line,
                endCharacter: c.range.end.character,
                text: c.text,
            })),
        });
    }));
    disposables.push(vscode.workspace.onDidSaveTextDocument((doc) => {
        server.broadcast(core_1.Methods.EDITOR_ON_SAVE, {
            uri: doc.uri.fsPath,
        });
    }));
    disposables.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            server.broadcast(core_1.Methods.EDITOR_ON_ACTIVE_CHANGE, {
                uri: editor.document.uri.fsPath,
                languageId: editor.document.languageId,
            });
        }
    }));
    return disposables;
}
function disposeEditorHandlers() {
    if (highlightDecoration) {
        highlightDecoration.dispose();
        highlightDecoration = null;
    }
}
//# sourceMappingURL=editor.js.map