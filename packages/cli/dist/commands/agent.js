"use strict";
/**
 * Agent Commands
 *
 * Send text, context, and code to the IDE's AI agent panel from terminal.
 * Multi-strategy approach:
 *   1. Tier 2: VS Code command execution (if bridge available)
 *   2. Tier 3: AppleScript clipboard + keystroke simulation (macOS)
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgentCommands = registerAgentCommands;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const core_1 = require("@bidirection/core");
// ─── Defaults ─────────────────────────────────────────────────────────
const DEFAULT_APP = 'Antigravity';
const DEFAULT_FOCUS_KEY = 'l'; // Cmd+L to focus agent panel
const DEFAULT_SUBMIT = 'enter';
// Known IDE presets
const IDE_PRESETS = {
    'Antigravity': { focusKey: 'l', submit: 'enter' },
    'Code': { focusKey: 'l', submit: 'enter' },
    'Visual Studio Code': { focusKey: 'l', submit: 'enter' },
    'Cursor': { focusKey: 'l', submit: 'enter' },
    'Code - Insiders': { focusKey: 'l', submit: 'enter' },
    'Windsurf': { focusKey: 'l', submit: 'enter' },
};
// ─── Prompt Templates ─────────────────────────────────────────────────
const TEMPLATES = {
    review: (content) => `Review this code for bugs, performance issues, and best practices:\n\n${content}`,
    explain: (content) => `Explain this code in detail:\n\n${content}`,
    refactor: (content) => `Suggest refactoring improvements for this code:\n\n${content}`,
    test: (content) => `Generate unit tests for this code:\n\n${content}`,
    document: (content) => `Write documentation for this code:\n\n${content}`,
    debug: (content) => `Debug this error. Identify the root cause and suggest a fix:\n\n${content}`,
    commit: (content) => `Generate a conventional commit message for this diff. Use the format: type(scope): description\n\n${content}`,
};
// ─── Core: Send text to agent panel ───────────────────────────────────
function sendViaAppleScript(text, appName, focusKey, submitMethod) {
    const escapedText = text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
    let focusKeystroke;
    if (focusKey.includes('+')) {
        const parts = focusKey.toLowerCase().split('+');
        const key = parts.pop();
        const modifiers = parts.map(m => {
            switch (m) {
                case 'shift': return 'shift down';
                case 'option':
                case 'alt': return 'option down';
                case 'control':
                case 'ctrl': return 'control down';
                case 'command':
                case 'cmd': return 'command down';
                default: return m + ' down';
            }
        }).join(', ');
        focusKeystroke = `keystroke "${key}" using {${modifiers}}`;
    }
    else {
        focusKeystroke = `keystroke "${focusKey}" using {command down}`;
    }
    const submitKeystroke = submitMethod === 'cmd+enter'
        ? 'keystroke return using {command down}'
        : 'keystroke return';
    const script = `
        set the clipboard to "${escapedText}"
        
        tell application "${appName}"
            activate
        end tell
        
        delay 0.5
        
        tell application "System Events"
            tell process "${appName}"
                ${focusKeystroke}
                delay 0.5
                keystroke "a" using {command down}
                delay 0.1
                keystroke "v" using {command down}
                delay 0.3
                ${submitKeystroke}
            end tell
        end tell
        
        return "ok"
    `;
    try {
        (0, child_process_1.execSync)(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
            encoding: 'utf-8',
            timeout: 15000,
        });
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error.message.includes('not allowed assistive access')) {
            console.error(chalk_1.default.red('✗ Accessibility permission required'));
            console.error(chalk_1.default.dim('  System Preferences → Privacy & Security → Accessibility'));
            process.exit(1);
        }
        throw error;
    }
}
async function sendViaBridge(text, socketPath) {
    try {
        const client = new core_1.BridgeClient(socketPath ? { socketPath } : {});
        await client.connect();
        try {
            const chatCommands = [
                'workbench.action.chat.open',
                'workbench.action.chat.newChat',
            ];
            for (const cmd of chatCommands) {
                try {
                    await client.request(core_1.Methods.COMMAND_EXECUTE, { command: cmd, args: [text] });
                    return true;
                }
                catch { /* try next */ }
            }
            return false;
        }
        finally {
            client.disconnect();
        }
    }
    catch {
        return false;
    }
}
function detectRunningIDE() {
    for (const name of Object.keys(IDE_PRESETS)) {
        try {
            const result = (0, child_process_1.execSync)(`osascript -e 'tell application "System Events" to name of processes whose name is "${name}"'`, { encoding: 'utf-8', timeout: 3000 }).trim();
            if (result && result !== '')
                return name;
        }
        catch { }
    }
    return null;
}
function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
        process.stdin.on('error', reject);
        setTimeout(() => {
            if (data.length === 0)
                reject(new Error('No stdin input'));
            else
                resolve(data);
        }, 5000);
    });
}
/**
 * Common send handler used by agent send, diff, review, commit, debug.
 */
function doSend(text, options) {
    let appName = options.app || DEFAULT_APP;
    const preset = IDE_PRESETS[appName];
    const focusKey = options.focusKey || preset?.focusKey || DEFAULT_FOCUS_KEY;
    const submitMethod = options.submit || preset?.submit || DEFAULT_SUBMIT;
    // Auto-detect if default isn't running
    if (appName === DEFAULT_APP) {
        const detected = detectRunningIDE();
        if (detected && detected !== appName) {
            appName = detected;
            console.log(chalk_1.default.dim(`  Auto-detected: ${appName}`));
        }
    }
    if (options.dryRun) {
        console.log(chalk_1.default.bold.cyan('\n🔍 Dry Run:\n'));
        console.log(`  App:     ${chalk_1.default.green(appName)}`);
        console.log(`  Focus:   ${chalk_1.default.green('Cmd+' + focusKey)}`);
        console.log(`  Submit:  ${chalk_1.default.green(submitMethod)}`);
        console.log(`  Length:  ${text.length} chars`);
        console.log(`  Preview:\n`);
        const preview = text.length > 500 ? text.substring(0, 500) + '\n...' : text;
        console.log(chalk_1.default.dim(preview));
        console.log();
        return;
    }
    console.log(chalk_1.default.dim(`  Sending ${text.length} chars to ${appName} agent panel...`));
    if (process.platform !== 'darwin') {
        console.error(chalk_1.default.red('✗ OS-level agent send only supported on macOS'));
        process.exit(1);
    }
    try {
        sendViaAppleScript(text, appName, focusKey, submitMethod);
        console.log(chalk_1.default.green(`✓ Sent to ${appName} agent panel`));
        console.log(chalk_1.default.dim(`  ${text.length} chars • Focus: Cmd+${focusKey} • Submit: ${submitMethod}`));
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(chalk_1.default.red(`✗ Failed: ${error.message}`));
        process.exit(1);
    }
}
// ─── Git Helpers ──────────────────────────────────────────────────────
function gitDiff(args) {
    try {
        return (0, child_process_1.execSync)(`git diff ${args}`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }).trim();
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(chalk_1.default.red(`✗ git diff failed: ${error.message}`));
        process.exit(1);
        return ''; // unreachable
    }
}
function gitStagedDiff() {
    return gitDiff('--cached');
}
function readFileWithMeta(filePath) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        console.error(chalk_1.default.red(`✗ File not found: ${resolved}`));
        process.exit(1);
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    const ext = path.extname(resolved).replace('.', '') || 'text';
    const lines = content.split('\n').length;
    return `File: ${resolved}\nLanguage: ${ext}\nLines: ${lines}\n\n\`\`\`${ext}\n${content}\n\`\`\``;
}
// ─── Read Agent Response via Clipboard ────────────────────────────────
function readAgentResponse(appName) {
    const script = `
        tell application "${appName}"
            activate
        end tell
        
        delay 0.3
        
        tell application "System Events"
            tell process "${appName}"
                -- Select all in the agent response area
                keystroke "a" using {command down}
                delay 0.2
                keystroke "c" using {command down}
                delay 0.3
            end tell
        end tell
        
        return the clipboard
    `;
    try {
        return (0, child_process_1.execSync)(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
            encoding: 'utf-8',
            timeout: 10000,
        }).trim();
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(chalk_1.default.red(`✗ Failed to read response: ${error.message}`));
        process.exit(1);
        return '';
    }
}
// ─── Register Commands ───────────────────────────────────────────────
function registerAgentCommands(program) {
    const agent = program
        .command('agent')
        .description('Interact with the IDE agent panel');
    const commonOpts = (cmd) => cmd
        .option('-a, --app <name>', 'Target IDE app name', DEFAULT_APP)
        .option('--focus-key <key>', 'Focus panel key (default: Cmd+L)', DEFAULT_FOCUS_KEY)
        .option('--submit <method>', '"enter" or "cmd+enter"', DEFAULT_SUBMIT)
        .option('-s, --socket <path>', 'Try bridge socket first')
        .option('--dry-run', 'Preview without executing');
    // ─── agent send ─────────────────────────────────────────────────
    commonOpts(agent
        .command('send')
        .description('Send a prompt to the agent panel')
        .argument('[text...]', 'Text to send (or use --stdin / --file)')
        .option('--stdin', 'Read text from stdin')
        .option('-f, --file <path>', 'Read text from a file')
        .option('-c, --context <files...>', 'Attach file content as context')
        .option('-t, --template <name>', 'Use a prompt template (review, explain, refactor, test, debug, commit)')).action(async (textParts, options) => {
        let text = '';
        if (options.stdin) {
            if (!process.stdin.isTTY) {
                text = await readStdin();
            }
            else {
                console.error(chalk_1.default.red('✗ --stdin specified but no piped input'));
                process.exit(1);
            }
        }
        else if (options.file) {
            text = readFileWithMeta(options.file);
        }
        else if (textParts && textParts.length > 0) {
            text = textParts.join(' ');
        }
        else {
            console.error(chalk_1.default.red('✗ No text. Use: agent send "prompt", --stdin, or --file'));
            process.exit(1);
        }
        // Attach context files
        if (options.context) {
            const contextParts = [];
            for (const cf of options.context) {
                contextParts.push(readFileWithMeta(cf));
            }
            text = text + '\n\n---\nContext:\n\n' + contextParts.join('\n\n---\n\n');
        }
        // Apply template
        if (options.template) {
            const tmpl = TEMPLATES[options.template];
            if (!tmpl) {
                console.error(chalk_1.default.red(`✗ Unknown template: ${options.template}`));
                console.error(chalk_1.default.dim('  Available: ' + Object.keys(TEMPLATES).join(', ')));
                process.exit(1);
            }
            text = tmpl(text);
        }
        text = text.trim();
        if (!text) {
            console.error(chalk_1.default.red('✗ Empty text'));
            process.exit(1);
        }
        doSend(text, options);
    });
    // ─── agent diff ─────────────────────────────────────────────────
    commonOpts(agent
        .command('diff')
        .description('Send git diff to agent for review')
        .argument('[ref]', 'Git ref (default: unstaged changes)')
        .option('--staged', 'Show staged changes')).action((ref, options) => {
        let diff;
        if (options.staged) {
            diff = gitStagedDiff();
        }
        else if (ref) {
            diff = gitDiff(ref);
        }
        else {
            diff = gitDiff('');
        }
        if (!diff) {
            console.log(chalk_1.default.yellow('No changes to show.'));
            process.exit(0);
        }
        const text = TEMPLATES.review(`\`\`\`diff\n${diff}\n\`\`\``);
        doSend(text, options);
    });
    // ─── agent commit ───────────────────────────────────────────────
    commonOpts(agent
        .command('commit')
        .description('Generate a commit message from staged changes')).action((options) => {
        const diff = gitStagedDiff();
        if (!diff) {
            console.log(chalk_1.default.yellow('No staged changes. Stage with: git add <files>'));
            process.exit(0);
        }
        const text = TEMPLATES.commit(`\`\`\`diff\n${diff}\n\`\`\``);
        doSend(text, options);
    });
    // ─── agent review ───────────────────────────────────────────────
    commonOpts(agent
        .command('review')
        .description('Send a file for code review')
        .argument('<file>', 'File to review')).action((file, options) => {
        const content = readFileWithMeta(file);
        const text = TEMPLATES.review(content);
        doSend(text, options);
    });
    // ─── agent explain ──────────────────────────────────────────────
    commonOpts(agent
        .command('explain')
        .description('Ask the agent to explain a file')
        .argument('<file>', 'File to explain')).action((file, options) => {
        const content = readFileWithMeta(file);
        const text = TEMPLATES.explain(content);
        doSend(text, options);
    });
    // ─── agent debug ────────────────────────────────────────────────
    commonOpts(agent
        .command('debug')
        .description('Send an error/stack trace for debugging')
        .argument('[text...]', 'Error text (or use --stdin / --file)')
        .option('--stdin', 'Read from stdin')
        .option('-f, --file <path>', 'Read from error log file')).action(async (textParts, options) => {
        let errorText = '';
        if (options.stdin && !process.stdin.isTTY) {
            errorText = await readStdin();
        }
        else if (options.file) {
            const filePath = path.resolve(options.file);
            if (!fs.existsSync(filePath)) {
                console.error(chalk_1.default.red(`✗ File not found: ${filePath}`));
                process.exit(1);
            }
            errorText = fs.readFileSync(filePath, 'utf-8');
        }
        else if (textParts && textParts.length > 0) {
            errorText = textParts.join(' ');
        }
        else {
            console.error(chalk_1.default.red('✗ No error text. Pipe with --stdin or provide text'));
            process.exit(1);
        }
        const text = TEMPLATES.debug(errorText.trim());
        doSend(text, options);
    });
    // ─── agent test ─────────────────────────────────────────────────
    commonOpts(agent
        .command('test')
        .description('Generate tests for a file')
        .argument('<file>', 'File to generate tests for')).action((file, options) => {
        const content = readFileWithMeta(file);
        const text = TEMPLATES.test(content);
        doSend(text, options);
    });
    // ─── agent read ─────────────────────────────────────────────────
    agent
        .command('read')
        .description('Read agent response via clipboard (copies from agent panel)')
        .option('-a, --app <name>', 'Target IDE app name', DEFAULT_APP)
        .action((options) => {
        if (process.platform !== 'darwin') {
            console.error(chalk_1.default.red('✗ Only supported on macOS'));
            process.exit(1);
        }
        const appName = options.app || DEFAULT_APP;
        const response = readAgentResponse(appName);
        console.log(response);
    });
    // ─── agent templates ────────────────────────────────────────────
    agent
        .command('templates')
        .description('List available prompt templates')
        .action(() => {
        console.log(chalk_1.default.bold.cyan('\n📝 Prompt Templates:\n'));
        for (const [name, fn] of Object.entries(TEMPLATES)) {
            // Show template name and first line of its output
            const preview = fn('{content}').split('\n')[0];
            console.log(`  ${chalk_1.default.green(name.padEnd(12))} ${chalk_1.default.dim(preview)}`);
        }
        console.log();
        process.exit(0);
    });
    // ─── agent detect ───────────────────────────────────────────────
    agent
        .command('detect')
        .description('Detect which IDE is currently running')
        .action(() => {
        console.log(chalk_1.default.bold.cyan('\n🔍 Detecting running IDEs...\n'));
        let found = 0;
        for (const name of Object.keys(IDE_PRESETS)) {
            try {
                const result = (0, child_process_1.execSync)(`osascript -e 'tell application "System Events" to name of processes whose name is "${name}"'`, { encoding: 'utf-8', timeout: 3000 }).trim();
                if (result && result !== '') {
                    const preset = IDE_PRESETS[name];
                    console.log(`  ${chalk_1.default.green('●')} ${chalk_1.default.bold(name)}`);
                    console.log(chalk_1.default.dim(`    Focus: Cmd+${preset.focusKey} • Submit: ${preset.submit}`));
                    found++;
                }
            }
            catch { }
        }
        if (found === 0) {
            console.log(chalk_1.default.yellow('  ⚠ No known IDEs detected'));
        }
        console.log();
        process.exit(0);
    });
}
//# sourceMappingURL=agent.js.map