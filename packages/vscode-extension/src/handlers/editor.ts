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

import * as vscode from 'vscode';
import { BridgeServer } from '../server';
import {
    Methods,
    ErrorCodes,
    GetTextParams,
    GetTextResult,
    GetSelectionParams,
    GetSelectionResult,
    SetCursorParams,
    SetCursorResult,
    ApplyEditParams,
    ApplyEditResult,
    HighlightParams,
    HighlightResult,
} from '@bidirection/core';

// Decoration type for highlighting
let highlightDecoration: vscode.TextEditorDecorationType | null = null;

function getHighlightDecoration(color?: string): vscode.TextEditorDecorationType {
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

function requireActiveEditor(): vscode.TextEditor {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        const err = new Error('No active editor');
        (err as any).code = ErrorCodes.NO_ACTIVE_EDITOR;
        throw err;
    }
    return editor;
}

export function registerEditorHandlers(server: BridgeServer): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];

    // editor/getText
    server.registerHandler(Methods.EDITOR_GET_TEXT, async (params) => {
        const p = (params || {}) as GetTextParams;

        let doc: vscode.TextDocument;
        if (p.uri) {
            doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
        } else {
            const editor = requireActiveEditor();
            doc = editor.document;
        }

        const result: GetTextResult = {
            text: doc.getText(),
            uri: doc.uri.fsPath,
            languageId: doc.languageId,
            lineCount: doc.lineCount,
        };
        return result;
    });

    // editor/getSelection
    server.registerHandler(Methods.EDITOR_GET_SELECTION, async (params) => {
        const p = (params || {}) as GetSelectionParams;
        const editor = requireActiveEditor();

        if (p.uri && editor.document.uri.fsPath !== p.uri) {
            throw new Error(`Active editor (${editor.document.uri.fsPath}) doesn't match requested URI (${p.uri})`);
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        const result: GetSelectionResult = {
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
    server.registerHandler(Methods.EDITOR_SET_CURSOR, async (params) => {
        const p = params as unknown as SetCursorParams;

        let editor: vscode.TextEditor;
        if (p.uri) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
            editor = await vscode.window.showTextDocument(doc);
        } else {
            editor = requireActiveEditor();
        }

        const position = new vscode.Position(p.line, p.character);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter
        );

        const result: SetCursorResult = { success: true };
        return result;
    });

    // editor/applyEdit
    server.registerHandler(Methods.EDITOR_APPLY_EDIT, async (params) => {
        const p = params as unknown as ApplyEditParams;

        const workspaceEdit = new vscode.WorkspaceEdit();
        const uri = vscode.Uri.file(p.uri);

        for (const edit of p.edits) {
            const range = new vscode.Range(
                new vscode.Position(edit.startLine, edit.startCharacter),
                new vscode.Position(edit.endLine, edit.endCharacter)
            );
            workspaceEdit.replace(uri, range, edit.newText);
        }

        const success = await vscode.workspace.applyEdit(workspaceEdit);

        const result: ApplyEditResult = { success, uri: p.uri };
        return result;
    });

    // editor/highlight
    server.registerHandler(Methods.EDITOR_HIGHLIGHT, async (params) => {
        const p = params as unknown as HighlightParams;

        let editor: vscode.TextEditor;
        if (p.uri) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p.uri));
            editor = await vscode.window.showTextDocument(doc);
        } else {
            editor = requireActiveEditor();
        }

        const decoration = getHighlightDecoration(p.color);
        const range = new vscode.Range(
            new vscode.Position(p.startLine, 0),
            new vscode.Position(p.endLine, Number.MAX_SAFE_INTEGER)
        );
        editor.setDecorations(decoration, [range]);

        // Also select and reveal the range
        editor.selection = new vscode.Selection(
            new vscode.Position(p.startLine, 0),
            new vscode.Position(p.endLine, Number.MAX_SAFE_INTEGER)
        );
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

        const result: HighlightResult = { success: true };
        return result;
    });

    // Subscribe to editor change events and broadcast to clients
    disposables.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            server.broadcast(Methods.EDITOR_ON_CHANGE, {
                uri: e.document.uri.fsPath,
                changes: e.contentChanges.map((c) => ({
                    startLine: c.range.start.line,
                    startCharacter: c.range.start.character,
                    endLine: c.range.end.line,
                    endCharacter: c.range.end.character,
                    text: c.text,
                })),
            });
        })
    );

    disposables.push(
        vscode.workspace.onDidSaveTextDocument((doc) => {
            server.broadcast(Methods.EDITOR_ON_SAVE, {
                uri: doc.uri.fsPath,
            });
        })
    );

    disposables.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                server.broadcast(Methods.EDITOR_ON_ACTIVE_CHANGE, {
                    uri: editor.document.uri.fsPath,
                    languageId: editor.document.languageId,
                });
            }
        })
    );

    return disposables;
}

export function disposeEditorHandlers(): void {
    if (highlightDecoration) {
        highlightDecoration.dispose();
        highlightDecoration = null;
    }
}
