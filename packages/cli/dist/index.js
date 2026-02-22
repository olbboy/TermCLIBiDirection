#!/usr/bin/env node
"use strict";
/**
 * BiDirection CLI
 *
 * Terminal client for controlling VS Code / Antigravity IDE
 * through the BiDirection bridge extension.
 *
 * Usage:
 *   bidirection discover       - Find active IDE sockets
 *   bidirection read           - Read active editor content
 *   bidirection open <file>    - Open file in IDE
 *   bidirection edit ...       - Apply edits to a file
 *   bidirection highlight ...  - Highlight lines in IDE
 *   bidirection exec <cmd>     - Execute IDE command
 *   bidirection diagnostics    - Get diagnostics
 *   bidirection info           - Get bridge info
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const discover_1 = require("./commands/discover");
const bridge_1 = require("./commands/bridge");
const os_fallback_1 = require("./commands/os-fallback");
const program = new commander_1.Command();
program
    .name('bidirection')
    .description('Terminal-to-IDE Bidirectional Communication Bridge')
    .version('1.0.0');
// Register all command groups
(0, discover_1.registerDiscoverCommand)(program);
(0, bridge_1.registerBridgeCommands)(program);
(0, os_fallback_1.registerOsFallbackCommands)(program);
program.parse();
//# sourceMappingURL=index.js.map