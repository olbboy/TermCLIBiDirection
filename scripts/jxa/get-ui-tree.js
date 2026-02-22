#!/usr/bin/env osascript -l JavaScript
/**
 * BiDirection: Dump UI Accessibility Tree of IDE
 * 
 * Usage: osascript -l JavaScript get-ui-tree.js [AppName] [MaxDepth]
 * Example: osascript -l JavaScript get-ui-tree.js "Code" 3
 * 
 * Requires: Accessibility permissions for your terminal app
 * (System Preferences → Privacy & Security → Accessibility)
 */

function run(argv) {
    const appName = argv[0] || "Code";
    const maxDepth = parseInt(argv[1]) || 3;

    const se = Application("System Events");
    let proc;

    try {
        proc = se.processes[appName];
        // Test if process exists
        proc.name();
    } catch (e) {
        return `Error: Application "${appName}" not found or not running.\nRunning apps: ${se.processes.name().join(', ')}`;
    }

    function dumpElement(el, depth) {
        if (depth > maxDepth) return "";

        const indent = "  ".repeat(depth);
        let role = "", title = "", value = "";

        try { role = el.role(); } catch (e) { }
        try { title = el.title() || ""; } catch (e) { }
        try {
            if (!title) {
                value = el.description() || el.value() || "";
                if (typeof value === 'object') value = JSON.stringify(value);
            }
        } catch (e) { }

        const label = title || value;
        const labelStr = label ? `: "${String(label).substring(0, 100)}"` : "";
        let line = `${indent}[${role}]${labelStr}\n`;

        try {
            const children = el.uiElements();
            const count = Math.min(children.length, 30);
            for (let i = 0; i < count; i++) {
                line += dumpElement(children[i], depth + 1);
            }
            if (children.length > 30) {
                line += `${indent}  ... (${children.length - 30} more)\n`;
            }
        } catch (e) { }

        return line;
    }

    let result = `UI Tree for: ${appName}\n${"=".repeat(40)}\n`;

    try {
        const windows = proc.windows();
        for (let i = 0; i < windows.length; i++) {
            let windowTitle = "";
            try { windowTitle = windows[i].title(); } catch (e) { }
            result += `\nWindow ${i}: "${windowTitle}"\n${"-".repeat(40)}\n`;
            result += dumpElement(windows[i], 0);
        }
    } catch (e) {
        result += `Error accessing UI: ${e.message}\n`;
        result += "Make sure Accessibility access is granted to your terminal.";
    }

    return result;
}
