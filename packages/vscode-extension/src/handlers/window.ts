/**
 * Window Handlers
 * 
 * Handles window/UI-related JSON-RPC requests:
 * - window/showMessage
 * - window/showQuickPick
 * - command/execute
 * - getInfo
 */

import * as vscode from 'vscode';
import { BridgeServer } from '../server';
import {
    Methods,
    BRIDGE_VERSION,
    ShowMessageParams,
    ShowMessageResult,
    ShowQuickPickParams,
    ShowQuickPickResult,
    ExecuteCommandParams,
    ExecuteCommandResult,
    GetInfoResult,
} from '@bidirection/core';

export function registerWindowHandlers(server: BridgeServer): void {

    // window/showMessage
    server.registerHandler(Methods.WINDOW_SHOW_MESSAGE, async (params) => {
        const p = params as unknown as ShowMessageParams;
        const actions = p.actions || [];
        let selectedAction: string | undefined;

        switch (p.type) {
            case 'warning':
                selectedAction = await vscode.window.showWarningMessage(p.message, ...actions);
                break;
            case 'error':
                selectedAction = await vscode.window.showErrorMessage(p.message, ...actions);
                break;
            default:
                selectedAction = await vscode.window.showInformationMessage(p.message, ...actions);
        }

        const result: ShowMessageResult = { selectedAction };
        return result;
    });

    // window/showQuickPick
    server.registerHandler(Methods.WINDOW_SHOW_QUICK_PICK, async (params) => {
        const p = params as unknown as ShowQuickPickParams;

        const items = p.items.map((item) => ({
            label: item.label,
            description: item.description,
            detail: item.detail,
        }));

        const selected = await vscode.window.showQuickPick(items, {
            title: p.title,
            placeHolder: p.placeholder,
        });

        const result: ShowQuickPickResult = {
            selectedItem: selected?.label,
        };
        return result;
    });

    // command/execute
    server.registerHandler(Methods.COMMAND_EXECUTE, async (params) => {
        const p = params as unknown as ExecuteCommandParams;
        const cmdResult = await vscode.commands.executeCommand(p.command, ...(p.args || []));

        const result: ExecuteCommandResult = { result: cmdResult };
        return result;
    });

    // getInfo (meta)
    server.registerHandler(Methods.GET_INFO, async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders?.map(
            (f) => f.uri.fsPath
        ) || [];

        const result: GetInfoResult = {
            name: 'BiDirection Bridge',
            version: BRIDGE_VERSION,
            ide: 'vscode',
            ideVersion: vscode.version,
            socketPath: server.getSocketPath(),
            pid: process.pid,
            workspaceFolders,
        };
        return result;
    });
}
