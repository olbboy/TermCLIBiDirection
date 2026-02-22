/**
 * Agent Commands
 *
 * Send text to the IDE's AI agent panel from the terminal.
 * Uses a multi-strategy approach:
 *   1. Tier 2: VS Code command execution (if bridge is available)
 *   2. Tier 3: JXA/AppleScript clipboard + keystroke simulation (macOS)
 */
import { Command } from 'commander';
export declare function registerAgentCommands(program: Command): void;
//# sourceMappingURL=agent.d.ts.map