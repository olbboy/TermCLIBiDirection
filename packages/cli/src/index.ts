#!/usr/bin/env node
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

import { Command } from 'commander';
import { registerDiscoverCommand } from './commands/discover';
import { registerBridgeCommands } from './commands/bridge';
import { registerOsFallbackCommands } from './commands/os-fallback';
import { registerAgentCommands } from './commands/agent';
import { registerBrainCommands } from './commands/brain';
import { registerKnowledgeCommands } from './commands/knowledge';
import { registerWorkflowCommands } from './commands/workflow';
import { registerSkillCommands } from './commands/skill';

const program = new Command();

program
    .name('bidirection')
    .description('Terminal-to-IDE Bidirectional Communication Bridge')
    .version('1.0.0');

// Register all command groups
registerDiscoverCommand(program);
registerBridgeCommands(program);
registerOsFallbackCommands(program);
registerAgentCommands(program);
registerBrainCommands(program);
registerKnowledgeCommands(program);
registerWorkflowCommands(program);
registerSkillCommands(program);

program.parse();
