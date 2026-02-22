"use strict";
/**
 * BiDirection Bridge Extension
 *
 * VS Code Extension entry point.
 * Auto-starts a Unix Domain Socket server that accepts JSON-RPC
 * commands from external terminals for bidirectional IDE control.
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const server_1 = require("./server");
const editor_1 = require("./handlers/editor");
const workspace_1 = require("./handlers/workspace");
const terminal_1 = require("./handlers/terminal");
const window_1 = require("./handlers/window");
let bridgeServer = null;
let statusBarItem;
let outputChannel;
async function activate(context) {
    outputChannel = vscode.window.createOutputChannel('BiDirection Bridge');
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const log = (msg) => {
        outputChannel.appendLine(`[${new Date().toISOString()}] ${msg}`);
    };
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('bidirection.startBridge', () => startBridge(log)), vscode.commands.registerCommand('bidirection.stopBridge', () => stopBridge(log)), vscode.commands.registerCommand('bidirection.showStatus', () => showStatus()), statusBarItem, outputChannel);
    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('bidirection');
    if (config.get('autoStart', true)) {
        await startBridge(log);
    }
}
async function startBridge(log) {
    if (bridgeServer) {
        vscode.window.showInformationMessage('BiDirection Bridge is already running');
        return;
    }
    try {
        const config = vscode.workspace.getConfiguration('bidirection');
        const customPath = config.get('socketPath', '') || undefined;
        bridgeServer = new server_1.BridgeServer(customPath, log);
        // Register all handlers
        const editorDisposables = (0, editor_1.registerEditorHandlers)(bridgeServer);
        (0, workspace_1.registerWorkspaceHandlers)(bridgeServer);
        (0, terminal_1.registerTerminalHandlers)(bridgeServer);
        (0, window_1.registerWindowHandlers)(bridgeServer);
        // Start the server
        await bridgeServer.start();
        // Update status bar
        updateStatusBar(true);
        log(`Bridge started successfully at ${bridgeServer.getSocketPath()}`);
        vscode.window.showInformationMessage(`BiDirection Bridge started at ${bridgeServer.getSocketPath()}`);
        // Cleanup disposables when server stops
        for (const d of editorDisposables) {
            // We'll manage these manually
            d.dispose;
        }
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log(`Failed to start bridge: ${error.message}`);
        vscode.window.showErrorMessage(`BiDirection Bridge failed to start: ${error.message}`);
        bridgeServer = null;
        updateStatusBar(false);
    }
}
function stopBridge(log) {
    if (!bridgeServer) {
        vscode.window.showInformationMessage('BiDirection Bridge is not running');
        return;
    }
    bridgeServer.stop();
    bridgeServer = null;
    (0, editor_1.disposeEditorHandlers)();
    updateStatusBar(false);
    log('Bridge stopped');
    vscode.window.showInformationMessage('BiDirection Bridge stopped');
}
function showStatus() {
    if (bridgeServer) {
        const clientCount = bridgeServer.getClientCount();
        vscode.window.showInformationMessage(`BiDirection Bridge: Running at ${bridgeServer.getSocketPath()} | ` +
            `${clientCount} client(s) connected`);
    }
    else {
        vscode.window.showInformationMessage('BiDirection Bridge: Not running');
    }
}
function updateStatusBar(running) {
    if (running && bridgeServer) {
        statusBarItem.text = '$(plug) BiDirection';
        statusBarItem.tooltip = `Bridge: ${bridgeServer.getSocketPath()} (${bridgeServer.getClientCount()} clients)`;
        statusBarItem.command = 'bidirection.showStatus';
        statusBarItem.show();
    }
    else {
        statusBarItem.text = '$(debug-disconnect) BiDirection';
        statusBarItem.tooltip = 'Bridge not running. Click to start.';
        statusBarItem.command = 'bidirection.startBridge';
        statusBarItem.show();
    }
}
function deactivate() {
    if (bridgeServer) {
        bridgeServer.stop();
        bridgeServer = null;
    }
    (0, editor_1.disposeEditorHandlers)();
}
//# sourceMappingURL=extension.js.map