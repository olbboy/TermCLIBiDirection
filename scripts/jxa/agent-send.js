#!/usr/bin/env osascript -l JavaScript
/**
 * BiDirection: Send text to IDE Agent Panel
 * 
 * Uses clipboard + keystroke simulation to insert text into the
 * agent/chat panel of VS Code forks (Antigravity, Cursor, etc.)
 * 
 * Usage: osascript -l JavaScript agent-send.js "<text>" [appName] [focusKey] [submitKey]
 * 
 * Arguments:
 *   text      - The text to send to the agent panel
 *   appName   - Target app name (default: "Antigravity")  
 *   focusKey   - Key to focus agent panel (default: "l" for Cmd+L)
 *   submitKey  - How to submit: "enter" or "cmd+enter" (default: "enter")
 *
 * Requires: Accessibility permissions for your terminal app
 */

function run(argv) {
    const text = argv[0];
    const appName = argv[1] || "Antigravity";
    const focusKey = argv[2] || "l";
    const submitMethod = argv[3] || "enter";

    if (!text) {
        return "Error: No text provided.\nUsage: agent-send.js \"<text>\" [appName] [focusKey] [submitKey]";
    }

    const se = Application("System Events");

    // ─── Step 1: Verify the target app is running ─────────────────────
    let proc;
    try {
        proc = se.processes[appName];
        proc.name(); // Throws if not running
    } catch (e) {
        // Try common alternative names
        const alternatives = [
            "Antigravity", "Code", "Visual Studio Code",
            "Cursor", "VSCodium", "Code - Insiders"
        ];
        let found = false;
        for (const alt of alternatives) {
            try {
                proc = se.processes[alt];
                proc.name();
                found = true;
                break;
            } catch { }
        }
        if (!found) {
            const running = se.processes.name()
                .filter(n => n.match(/code|antigravity|cursor|vs/i))
                .join(", ");
            return `Error: "${appName}" not running.\n${running ? "Found IDE-like: " + running : "No IDE processes found."}`;
        }
    }

    const app = Application(proc.name());

    // ─── Step 2: Save current clipboard ───────────────────────────────
    const origClipboard = app.includeStandardAdditions = true;
    let oldClip;
    try {
        const currentApp = Application.currentApplication();
        currentApp.includeStandardAdditions = true;
        oldClip = currentApp.theClipboard();
    } catch { }

    // ─── Step 3: Set clipboard to our text ────────────────────────────
    const currentApp = Application.currentApplication();
    currentApp.includeStandardAdditions = true;
    currentApp.setTheClipboardTo(text);

    // ─── Step 4: Activate the target app ──────────────────────────────
    app.activate();
    delay(0.5);  // Wait for app to come to front

    // ─── Step 5: Focus the agent panel ────────────────────────────────
    // Common shortcuts for agent panels in VS Code forks:
    //   Cmd+L       - Antigravity, Cursor, Copilot Chat focus
    //   Cmd+Shift+I - Some VS Code AI extensions
    //   Ctrl+Shift+A - Alternative

    if (focusKey.includes("+")) {
        // Complex shortcut like "shift+l"
        const parts = focusKey.toLowerCase().split("+");
        const key = parts.pop();
        const modifiers = parts.map(m => {
            switch (m) {
                case "shift": return "shift down";
                case "option": case "alt": return "option down";
                case "control": case "ctrl": return "control down";
                case "command": case "cmd": return "command down";
                default: return m + " down";
            }
        });
        se.keystroke(key, { using: modifiers });
    } else {
        // Simple Cmd+key (most common for agent panel focus)
        se.keystroke(focusKey, { using: "command down" });
    }

    delay(0.5);  // Wait for panel to open/focus

    // ─── Step 6: Clear any existing text in the input ─────────────────
    se.keystroke("a", { using: "command down" });  // Select all
    delay(0.1);

    // ─── Step 7: Paste our text ───────────────────────────────────────
    se.keystroke("v", { using: "command down" });
    delay(0.3);  // Wait for paste

    // ─── Step 8: Submit ───────────────────────────────────────────────
    if (submitMethod === "cmd+enter") {
        se.keystroke("\r", { using: "command down" });
    } else {
        // Default: Enter
        se.keystroke("\r");
    }

    // ─── Step 9: Restore clipboard (optional, best-effort) ────────────
    delay(0.5);
    try {
        if (oldClip) {
            currentApp.setTheClipboardTo(oldClip);
        }
    } catch { }

    return `✓ Sent ${text.length} chars to ${proc.name()} agent panel`;
}
