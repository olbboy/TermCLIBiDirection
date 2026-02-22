"use strict";
/**
 * Code Tracker — Inspect Antigravity's active code tracking snapshots
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
exports.registerTrackerCommands = registerTrackerCommands;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const TRACKER_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'code_tracker', 'active');
function listTrackedProjects() {
    if (!fs.existsSync(TRACKER_DIR))
        return [];
    return fs.readdirSync(TRACKER_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => {
        const parts = d.name.match(/^(.+)_([a-f0-9]{40})$/);
        const projectPath = path.join(TRACKER_DIR, d.name);
        const files = fs.readdirSync(projectPath).filter(f => !f.startsWith('.'));
        const stat = fs.statSync(projectPath);
        return {
            name: parts ? parts[1] : d.name,
            hash: parts ? parts[2] : '',
            dirName: d.name,
            path: projectPath,
            fileCount: files.length,
            lastModified: stat.mtime,
        };
    })
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}
function listTrackedFiles(projectDir) {
    if (!fs.existsSync(projectDir))
        return [];
    return fs.readdirSync(projectDir)
        .filter(f => !f.startsWith('.'))
        .map(f => {
        const match = f.match(/^([a-f0-9]+)_(.+)$/);
        const fullPath = path.join(projectDir, f);
        const stat = fs.statSync(fullPath);
        return {
            md5: match ? match[1] : '',
            filename: match ? match[2] : f,
            fullPath,
            size: stat.size,
            modified: stat.mtime,
        };
    })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
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
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}
function registerTrackerCommands(program) {
    const tracker = program
        .command('tracker')
        .description('Inspect Antigravity code tracker snapshots');
    // ─── tracker list ─────────────────────────────────────────────
    tracker
        .command('list')
        .description('List all tracked projects')
        .action(() => {
        const projects = listTrackedProjects();
        if (projects.length === 0) {
            console.log(chalk_1.default.yellow('No tracked projects.'));
            process.exit(0);
        }
        console.log(chalk_1.default.bold.cyan(`\n📍 Tracked Projects (${projects.length}):\n`));
        for (const p of projects) {
            console.log(`  ${chalk_1.default.bold.green(p.name)} ${chalk_1.default.dim(timeAgo(p.lastModified))}`);
            console.log(chalk_1.default.dim(`    ${p.fileCount} files • ${p.hash.substring(0, 8)}...`));
        }
        console.log();
        process.exit(0);
    });
    // ─── tracker files ────────────────────────────────────────────
    tracker
        .command('files')
        .description('Show agent-edited files for a project')
        .argument('[project]', 'Project name (fuzzy match, default: current)')
        .action((projectName) => {
        const projects = listTrackedProjects();
        let project;
        if (projectName) {
            project = projects.find(p => p.name === projectName ||
                p.name.toLowerCase().includes(projectName.toLowerCase()));
        }
        else {
            // Auto-detect from cwd
            const cwdName = path.basename(process.cwd());
            project = projects.find(p => p.name.toLowerCase() === cwdName.toLowerCase());
            if (!project && projects.length > 0) {
                project = projects[0]; // most recent
            }
        }
        if (!project) {
            console.error(chalk_1.default.red(`Project "${projectName || 'current'}" not found in tracker.`));
            console.log(chalk_1.default.dim('Available: ' + projects.map(p => p.name).join(', ')));
            process.exit(1);
        }
        const files = listTrackedFiles(project.path);
        console.log(chalk_1.default.bold.cyan(`\n📍 ${project.name} — ${files.length} tracked files:\n`));
        for (const f of files) {
            console.log(`  ${chalk_1.default.green(f.filename)} ${chalk_1.default.dim(formatSize(f.size))} ${chalk_1.default.dim(timeAgo(f.modified))}`);
        }
        console.log();
        process.exit(0);
    });
    // ─── tracker diff ─────────────────────────────────────────────
    tracker
        .command('diff')
        .description('Diff tracked snapshot vs current workspace file')
        .argument('<file>', 'Filename to diff')
        .argument('[project]', 'Project name (default: current)')
        .action((fileName, projectName) => {
        const projects = listTrackedProjects();
        let project;
        if (projectName) {
            project = projects.find(p => p.name.toLowerCase().includes(projectName.toLowerCase()));
        }
        else {
            const cwdName = path.basename(process.cwd());
            project = projects.find(p => p.name.toLowerCase() === cwdName.toLowerCase()) || projects[0];
        }
        if (!project) {
            console.error(chalk_1.default.red('Project not found in tracker.'));
            process.exit(1);
        }
        const files = listTrackedFiles(project.path);
        const tracked = files.find(f => f.filename === fileName || f.filename.includes(fileName));
        if (!tracked) {
            console.error(chalk_1.default.red(`File "${fileName}" not found in tracker.`));
            console.log(chalk_1.default.dim('Tracked files: ' + files.map(f => f.filename).join(', ')));
            process.exit(1);
        }
        // Find workspace file
        const workspaceFile = findWorkspaceFile(tracked.filename);
        if (!workspaceFile) {
            console.log(chalk_1.default.yellow(`Workspace file not found. Showing tracked snapshot:`));
            console.log(fs.readFileSync(tracked.fullPath, 'utf-8'));
            process.exit(0);
        }
        try {
            const diff = (0, child_process_1.execSync)(`diff -u "${workspaceFile}" "${tracked.fullPath}" || true`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 5 });
            if (!diff.trim()) {
                console.log(chalk_1.default.green('✓ Files are identical'));
            }
            else {
                console.log(chalk_1.default.bold.cyan(`\n📍 Diff: workspace → tracker snapshot\n`));
                // Colorize diff output
                for (const line of diff.split('\n')) {
                    if (line.startsWith('+'))
                        console.log(chalk_1.default.green(line));
                    else if (line.startsWith('-'))
                        console.log(chalk_1.default.red(line));
                    else if (line.startsWith('@'))
                        console.log(chalk_1.default.cyan(line));
                    else
                        console.log(line);
                }
            }
        }
        catch {
            console.error(chalk_1.default.red('✗ Diff failed'));
            process.exit(1);
        }
        process.exit(0);
    });
}
function findWorkspaceFile(filename) {
    // Search in cwd and common source directories
    const searchDirs = [process.cwd()];
    try {
        const gitRoot = (0, child_process_1.execSync)('git rev-parse --show-toplevel', {
            encoding: 'utf-8', timeout: 3000
        }).trim();
        if (gitRoot)
            searchDirs.unshift(gitRoot);
    }
    catch { }
    for (const dir of searchDirs) {
        try {
            const result = (0, child_process_1.execSync)(`find "${dir}" -name "${filename}" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" | head -1`, { encoding: 'utf-8', timeout: 5000 }).trim();
            if (result)
                return result;
        }
        catch { }
    }
    return null;
}
//# sourceMappingURL=tracker.js.map