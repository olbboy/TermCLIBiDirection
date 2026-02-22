/**
 * Workspace Handlers
 * 
 * Handles workspace-related JSON-RPC requests:
 * - workspace/openFile
 * - workspace/getDiagnostics
 * - workspace/getOpenFiles
 */

import * as vscode from 'vscode';
import { BridgeServer } from '../server';
import {
    Methods,
    OpenFileParams,
    OpenFileResult,
    GetDiagnosticsParams,
    GetDiagnosticsResult,
    DiagnosticItem,
    GetOpenFilesResult,
} from '@bidirection/core';

const severityMap: Record<number, DiagnosticItem['severity']> = {
    [vscode.DiagnosticSeverity.Error]: 'error',
    [vscode.DiagnosticSeverity.Warning]: 'warning',
    [vscode.DiagnosticSeverity.Information]: 'info',
    [vscode.DiagnosticSeverity.Hint]: 'hint',
};

export function registerWorkspaceHandlers(server: BridgeServer): void {

    // workspace/openFile
    server.registerHandler(Methods.WORKSPACE_OPEN_FILE, async (params) => {
        const p = params as unknown as OpenFileParams;
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
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
        }

        const result: OpenFileResult = { success: true, uri: p.uri };
        return result;
    });

    // workspace/getDiagnostics
    server.registerHandler(Methods.WORKSPACE_GET_DIAGNOSTICS, async (params) => {
        const p = (params || {}) as GetDiagnosticsParams;
        const allDiagnostics = vscode.languages.getDiagnostics();
        const diagnosticItems: DiagnosticItem[] = [];

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

        const result: GetDiagnosticsResult = { diagnostics: diagnosticItems };
        return result;
    });

    // workspace/getOpenFiles
    server.registerHandler(Methods.WORKSPACE_GET_OPEN_FILES, async () => {
        const activeUri = vscode.window.activeTextEditor?.document.uri.fsPath;
        const files: GetOpenFilesResult['files'] = [];

        // Use tabGroups API for comprehensive list
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                if (tab.input instanceof vscode.TabInputText) {
                    const uri = tab.input.uri.fsPath;
                    let isDirty = false;
                    let languageId = 'unknown';

                    // Try to get document info
                    try {
                        const doc = vscode.workspace.textDocuments.find(
                            (d) => d.uri.fsPath === uri
                        );
                        if (doc) {
                            isDirty = doc.isDirty;
                            languageId = doc.languageId;
                        }
                    } catch {
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

        const result: GetOpenFilesResult = { files };
        return result;
    });
}
