"use strict";
/**
 * Conversation Commands — Browse Antigravity conversation data
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
exports.registerConversationCommands = registerConversationCommands;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONVERSATIONS_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'conversations');
const RECORDINGS_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'browser_recordings');
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}
function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
function registerConversationCommands(program) {
    const conv = program
        .command('conv')
        .alias('conversation')
        .description('Browse Antigravity conversation data');
    // ─── conv list ────────────────────────────────────────────────
    conv
        .command('list')
        .description('List all conversations by date/size')
        .option('-n, --recent <count>', 'Show N most recent', '10')
        .option('--all', 'Show all conversations')
        .action((options) => {
        if (!fs.existsSync(CONVERSATIONS_DIR)) {
            console.log(chalk_1.default.yellow('No conversations found.'));
            process.exit(0);
        }
        const files = fs.readdirSync(CONVERSATIONS_DIR)
            .filter(f => f.endsWith('.pb'))
            .map(f => {
            const filePath = path.join(CONVERSATIONS_DIR, f);
            const stat = fs.statSync(filePath);
            return {
                id: f.replace('.pb', ''),
                size: stat.size,
                modified: stat.mtime,
            };
        })
            .sort((a, b) => b.modified.getTime() - a.modified.getTime());
        const limit = options.all ? files.length : parseInt(options.recent);
        const shown = files.slice(0, limit);
        console.log(chalk_1.default.bold.cyan(`\n💬 Conversations (${shown.length}/${files.length}):\n`));
        for (const f of shown) {
            // Check if this conversation has brain artifacts
            const brainPath = path.join(os.homedir(), '.gemini', 'antigravity', 'brain', f.id);
            const hasBrain = fs.existsSync(brainPath);
            // Check for recordings
            const hasRecording = fs.existsSync(path.join(RECORDINGS_DIR, f.id));
            const icons = [
                hasBrain ? '🧠' : '',
                hasRecording ? '📹' : '',
            ].filter(Boolean).join('');
            console.log(`  ${chalk_1.default.dim(f.id.substring(0, 8))}  ${chalk_1.default.dim(formatSize(f.size).padEnd(7))} ${chalk_1.default.dim(timeAgo(f.modified).padEnd(8))} ${icons}`);
        }
        console.log();
        process.exit(0);
    });
    // ─── conv recordings ──────────────────────────────────────────
    conv
        .command('recordings')
        .description('Show browser recordings for a conversation')
        .argument('[id]', 'Conversation ID (default: latest with recordings)')
        .action((id) => {
        if (!fs.existsSync(RECORDINGS_DIR)) {
            console.log(chalk_1.default.yellow('No browser recordings found.'));
            process.exit(0);
        }
        const recordingDirs = fs.readdirSync(RECORDINGS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory());
        if (id) {
            const dir = recordingDirs.find(d => d.name === id || d.name.startsWith(id));
            if (!dir) {
                console.error(chalk_1.default.red(`No recordings for conversation "${id}".`));
                console.log(chalk_1.default.dim('Available: ' + recordingDirs.map(d => d.name.substring(0, 8)).join(', ')));
                process.exit(1);
            }
            showRecordings(dir.name);
        }
        else {
            // List all conversations with recordings
            console.log(chalk_1.default.bold.cyan(`\n📹 Conversations with Recordings (${recordingDirs.length}):\n`));
            for (const d of recordingDirs) {
                const recPath = path.join(RECORDINGS_DIR, d.name);
                const files = fs.readdirSync(recPath).filter(f => !f.startsWith('.'));
                console.log(`  ${chalk_1.default.dim(d.name.substring(0, 8))} — ${chalk_1.default.green(files.length + ' files')}`);
            }
            console.log();
        }
        process.exit(0);
    });
}
function showRecordings(convId) {
    const recPath = path.join(RECORDINGS_DIR, convId);
    const files = fs.readdirSync(recPath)
        .filter(f => !f.startsWith('.'))
        .map(f => {
        const filePath = path.join(recPath, f);
        const stat = fs.statSync(filePath);
        return { name: f, size: stat.size, modified: stat.mtime };
    })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    console.log(chalk_1.default.bold.cyan(`\n📹 Recordings for ${convId.substring(0, 8)}... (${files.length}):\n`));
    for (const f of files) {
        const ext = path.extname(f.name).replace('.', '').toUpperCase();
        console.log(`  ${chalk_1.default.green(f.name)} ${chalk_1.default.dim(formatSize(f.size))} ${chalk_1.default.dim(ext)}`);
    }
    console.log(chalk_1.default.dim(`\n  Path: ${recPath}\n`));
}
//# sourceMappingURL=conversation.js.map