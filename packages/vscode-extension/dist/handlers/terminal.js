"use strict";
/**
 * Terminal Handlers
 *
 * Handles terminal-related JSON-RPC requests:
 * - terminal/sendText
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
exports.registerTerminalHandlers = registerTerminalHandlers;
const vscode = __importStar(require("vscode"));
const core_1 = require("@bidirection/core");
function registerTerminalHandlers(server) {
    // terminal/sendText
    server.registerHandler(core_1.Methods.TERMINAL_SEND_TEXT, async (params) => {
        const p = params;
        let terminal;
        if (p.terminalName) {
            // Find by name
            terminal = vscode.window.terminals.find((t) => t.name === p.terminalName);
            if (!terminal) {
                terminal = vscode.window.createTerminal(p.terminalName);
            }
        }
        else {
            // Use active terminal or create one
            terminal = vscode.window.activeTerminal;
            if (!terminal) {
                terminal = vscode.window.createTerminal('BiDirection');
            }
        }
        terminal.show();
        terminal.sendText(p.text, p.addNewLine !== false);
        const result = { success: true };
        return result;
    });
}
//# sourceMappingURL=terminal.js.map