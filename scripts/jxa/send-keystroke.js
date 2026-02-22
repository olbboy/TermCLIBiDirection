#!/usr/bin/env osascript -l JavaScript
/**
 * BiDirection: Send Keystroke to IDE
 * 
 * Usage: osascript -l JavaScript send-keystroke.js <key> [modifier] [appName]
 * Example: osascript -l JavaScript send-keystroke.js "s" "command" "Code"
 * 
 * Modifiers: command, option, control, shift
 * Special keys: Use key codes for non-character keys
 */

function run(argv) {
    const key = argv[0];
    const modifier = argv[1] || "command";
    const appName = argv[2] || "Code";

    if (!key) {
        return "Usage: send-keystroke.js <key> [modifier] [appName]";
    }

    const modifierMap = {
        "command": "command down",
        "option": "option down",
        "control": "control down",
        "shift": "shift down",
        "cmd": "command down",
        "alt": "option down",
        "ctrl": "control down",
    };

    const modStr = modifierMap[modifier.toLowerCase()] || "command down";

    // Activate the target app
    const app = Application(appName);
    app.activate();
    delay(0.3);

    // Send keystroke via System Events
    const se = Application("System Events");
    se.keystroke(key, { using: [modStr] });

    return `Sent ${modifier}+${key} to ${appName}`;
}
