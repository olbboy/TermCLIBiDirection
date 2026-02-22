/**
 * Agent Commands
 *
 * Send text, context, and code to the IDE's AI agent panel from terminal.
 * Multi-strategy approach:
 *   1. Tier 2: VS Code command execution (if bridge available)
 *   2. Tier 3: AppleScript clipboard + keystroke simulation (macOS)
 */
import { Command } from 'commander';
export declare function registerAgentCommands(program: Command): void;
//# sourceMappingURL=agent.d.ts.map