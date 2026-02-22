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
export declare function registerEditorHandlers(server: BridgeServer): vscode.Disposable[];
export declare function disposeEditorHandlers(): void;
//# sourceMappingURL=editor.d.ts.map