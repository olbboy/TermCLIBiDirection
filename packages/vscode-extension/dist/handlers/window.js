"use strict";
/**
 * Window Handlers
 *
 * Handles window/UI-related JSON-RPC requests:
 * - window/showMessage
 * - window/showQuickPick
 * - command/execute
 * - getInfo
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
exports.registerWindowHandlers = registerWindowHandlers;
const vscode = __importStar(require("vscode"));
const core_1 = require("@bidirection/core");
function registerWindowHandlers(server) {
    // window/showMessage
    server.registerHandler(core_1.Methods.WINDOW_SHOW_MESSAGE, async (params) => {
        const p = params;
        const actions = p.actions || [];
        let selectedAction;
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
        const result = { selectedAction };
        return result;
    });
    // window/showQuickPick
    server.registerHandler(core_1.Methods.WINDOW_SHOW_QUICK_PICK, async (params) => {
        const p = params;
        const items = p.items.map((item) => ({
            label: item.label,
            description: item.description,
            detail: item.detail,
        }));
        const selected = await vscode.window.showQuickPick(items, {
            title: p.title,
            placeHolder: p.placeholder,
        });
        const result = {
            selectedItem: selected?.label,
        };
        return result;
    });
    // command/execute
    server.registerHandler(core_1.Methods.COMMAND_EXECUTE, async (params) => {
        const p = params;
        const cmdResult = await vscode.commands.executeCommand(p.command, ...(p.args || []));
        const result = { result: cmdResult };
        return result;
    });
    // getInfo (meta)
    server.registerHandler(core_1.Methods.GET_INFO, async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) || [];
        const result = {
            name: 'BiDirection Bridge',
            version: core_1.BRIDGE_VERSION,
            ide: 'vscode',
            ideVersion: vscode.version,
            socketPath: server.getSocketPath(),
            pid: process.pid,
            workspaceFolders,
        };
        return result;
    });
}
//# sourceMappingURL=window.js.map