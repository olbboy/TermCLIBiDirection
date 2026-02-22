/**
 * Terminal Handlers
 * 
 * Handles terminal-related JSON-RPC requests:
 * - terminal/sendText
 */

import * as vscode from 'vscode';
import { BridgeServer } from '../server';
import {
    Methods,
    SendTextParams,
    SendTextResult,
} from '@bidirection/core';

export function registerTerminalHandlers(server: BridgeServer): void {

    // terminal/sendText
    server.registerHandler(Methods.TERMINAL_SEND_TEXT, async (params) => {
        const p = params as unknown as SendTextParams;

        let terminal: vscode.Terminal | undefined;

        if (p.terminalName) {
            // Find by name
            terminal = vscode.window.terminals.find((t) => t.name === p.terminalName);
            if (!terminal) {
                terminal = vscode.window.createTerminal(p.terminalName);
            }
        } else {
            // Use active terminal or create one
            terminal = vscode.window.activeTerminal;
            if (!terminal) {
                terminal = vscode.window.createTerminal('BiDirection');
            }
        }

        terminal.show();
        terminal.sendText(p.text, p.addNewLine !== false);

        const result: SendTextResult = { success: true };
        return result;
    });
}
