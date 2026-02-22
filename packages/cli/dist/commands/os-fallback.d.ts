/**
 * OS Fallback Commands (Tier 3)
 *
 * Commands that use macOS system-level features for IDE interaction
 * when no extension bridge is available:
 * - URL Schemes (vscode://)
 * - JXA / AppleScript
 * - AXUIElement (via external Swift binary)
 */
import { Command } from 'commander';
export declare function registerOsFallbackCommands(program: Command): void;
//# sourceMappingURL=os-fallback.d.ts.map