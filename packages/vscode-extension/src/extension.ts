/**
 * BiDirection Bridge Extension
 * 
 * VS Code Extension entry point.
 * Auto-starts a Unix Domain Socket server that accepts JSON-RPC
 * commands from external terminals for bidirectional IDE control.
 */

import * as vscode from 'vscode';
import { BridgeServer } from './server';
import { registerEditorHandlers, disposeEditorHandlers } from './handlers/editor';
import { registerWorkspaceHandlers } from './handlers/workspace';
import { registerTerminalHandlers } from './handlers/terminal';
import { registerWindowHandlers } from './handlers/window';

let bridgeServer: BridgeServer | null = null;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('BiDirection Bridge');
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );

    const log = (msg: string) => {
        outputChannel.appendLine(`[${new Date().toISOString()}] ${msg}`);
    };

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('bidirection.startBridge', () => startBridge(log)),
        vscode.commands.registerCommand('bidirection.stopBridge', () => stopBridge(log)),
        vscode.commands.registerCommand('bidirection.showStatus', () => showStatus()),
        statusBarItem,
        outputChannel
    );

    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('bidirection');
    if (config.get<boolean>('autoStart', true)) {
        await startBridge(log);
    }
}

async function startBridge(log: (msg: string) => void): Promise<void> {
    if (bridgeServer) {
        vscode.window.showInformationMessage('BiDirection Bridge is already running');
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('bidirection');
        const customPath = config.get<string>('socketPath', '') || undefined;

        bridgeServer = new BridgeServer(customPath, log);

        // Register all handlers
        const editorDisposables = registerEditorHandlers(bridgeServer);
        registerWorkspaceHandlers(bridgeServer);
        registerTerminalHandlers(bridgeServer);
        registerWindowHandlers(bridgeServer);

        // Start the server
        await bridgeServer.start();

        // Update status bar
        updateStatusBar(true);

        log(`Bridge started successfully at ${bridgeServer.getSocketPath()}`);
        vscode.window.showInformationMessage(
            `BiDirection Bridge started at ${bridgeServer.getSocketPath()}`
        );

        // Cleanup disposables when server stops
        for (const d of editorDisposables) {
            // We'll manage these manually
            d.dispose;
        }
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        log(`Failed to start bridge: ${error.message}`);
        vscode.window.showErrorMessage(`BiDirection Bridge failed to start: ${error.message}`);
        bridgeServer = null;
        updateStatusBar(false);
    }
}

function stopBridge(log: (msg: string) => void): void {
    if (!bridgeServer) {
        vscode.window.showInformationMessage('BiDirection Bridge is not running');
        return;
    }

    bridgeServer.stop();
    bridgeServer = null;
    disposeEditorHandlers();
    updateStatusBar(false);
    log('Bridge stopped');
    vscode.window.showInformationMessage('BiDirection Bridge stopped');
}

function showStatus(): void {
    if (bridgeServer) {
        const clientCount = bridgeServer.getClientCount();
        vscode.window.showInformationMessage(
            `BiDirection Bridge: Running at ${bridgeServer.getSocketPath()} | ` +
            `${clientCount} client(s) connected`
        );
    } else {
        vscode.window.showInformationMessage('BiDirection Bridge: Not running');
    }
}

function updateStatusBar(running: boolean): void {
    if (running && bridgeServer) {
        statusBarItem.text = '$(plug) BiDirection';
        statusBarItem.tooltip = `Bridge: ${bridgeServer.getSocketPath()} (${bridgeServer.getClientCount()} clients)`;
        statusBarItem.command = 'bidirection.showStatus';
        statusBarItem.show();
    } else {
        statusBarItem.text = '$(debug-disconnect) BiDirection';
        statusBarItem.tooltip = 'Bridge not running. Click to start.';
        statusBarItem.command = 'bidirection.startBridge';
        statusBarItem.show();
    }
}

export function deactivate() {
    if (bridgeServer) {
        bridgeServer.stop();
        bridgeServer = null;
    }
    disposeEditorHandlers();
}
