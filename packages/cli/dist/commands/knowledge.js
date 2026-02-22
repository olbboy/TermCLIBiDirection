"use strict";
/**
 * Knowledge Commands — Browse & search Antigravity knowledge items
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKnowledgeCommands = registerKnowledgeCommands;
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@bidirection/core");
function registerKnowledgeCommands(program) {
    const knowledge = program
        .command('knowledge')
        .alias('ki')
        .description('Browse & search Antigravity knowledge items');
    // ─── knowledge list ─────────────────────────────────────────────
    knowledge
        .command('list')
        .description('List all knowledge items')
        .action(() => {
        const items = (0, core_1.listKnowledgeItems)();
        if (items.length === 0) {
            console.log(chalk_1.default.yellow('No knowledge items found.'));
            process.exit(0);
        }
        console.log(chalk_1.default.bold.cyan(`\n📚 Knowledge Items (${items.length}):\n`));
        for (const item of items) {
            console.log(`  ${chalk_1.default.bold.green(item.id)}`);
            if (item.summary) {
                // Show first 100 chars of summary
                const shortSummary = item.summary.length > 100
                    ? item.summary.substring(0, 100) + '...'
                    : item.summary;
                console.log(chalk_1.default.dim(`    ${shortSummary}`));
            }
            if (item.artifactPaths.length > 0) {
                console.log(chalk_1.default.dim(`    📄 ${item.artifactPaths.length} artifacts`));
            }
            if (item.lastAccessed) {
                console.log(chalk_1.default.dim(`    🕐 ${item.lastAccessed}`));
            }
            console.log();
        }
        process.exit(0);
    });
    // ─── knowledge show ─────────────────────────────────────────────
    knowledge
        .command('show')
        .description('Show a knowledge item details')
        .argument('<id>', 'Knowledge item ID')
        .option('-a, --artifact <path>', 'Read a specific artifact file')
        .action((id, options) => {
        const items = (0, core_1.listKnowledgeItems)();
        // Fuzzy match: allow partial ID
        const item = items.find((i) => i.id === id || i.id.includes(id));
        if (!item) {
            console.error(chalk_1.default.red(`Knowledge item "${id}" not found.`));
            console.log(chalk_1.default.dim('Available: ' + items.map((i) => i.id).join(', ')));
            process.exit(1);
        }
        if (options.artifact) {
            // Read specific artifact
            const content = (0, core_1.readKnowledgeArtifact)(item.id, options.artifact);
            if (!content) {
                console.error(chalk_1.default.red(`Artifact "${options.artifact}" not found.`));
                console.log(chalk_1.default.dim('Available: ' + item.artifactPaths.join(', ')));
                process.exit(1);
            }
            console.log(content);
            process.exit(0);
        }
        // Show overview
        console.log(chalk_1.default.bold.cyan(`\n📚 ${item.id}\n`));
        if (item.summary) {
            console.log(chalk_1.default.white(item.summary));
            console.log();
        }
        if (item.artifactPaths.length > 0) {
            console.log(chalk_1.default.bold('Artifacts:'));
            for (const artPath of item.artifactPaths) {
                console.log(`  📄 ${artPath}`);
            }
            console.log();
        }
        if (item.lastAccessed) {
            console.log(chalk_1.default.dim(`Last accessed: ${item.lastAccessed}`));
        }
        console.log();
        process.exit(0);
    });
    // ─── knowledge search ───────────────────────────────────────────
    knowledge
        .command('search')
        .description('Search across all knowledge items')
        .argument('<query>', 'Search text')
        .option('-n, --max <count>', 'Max results', parseInt)
        .action((query, options) => {
        const results = (0, core_1.searchKnowledge)(query);
        const max = options.max || 20;
        const shown = results.slice(0, max);
        if (shown.length === 0) {
            console.log(chalk_1.default.yellow(`No results for "${query}".`));
            process.exit(0);
        }
        console.log(chalk_1.default.bold.cyan(`\n🔍 Results for "${query}" (${shown.length}/${results.length}):\n`));
        let lastKI = '';
        for (const r of shown) {
            if (r.knowledgeId !== lastKI) {
                console.log(chalk_1.default.bold.green(`  ${r.knowledgeId}`));
                lastKI = r.knowledgeId;
            }
            const lineStr = r.line > 0 ? `:${r.line}` : '';
            console.log(chalk_1.default.dim(`    ${r.file}${lineStr}`));
            // Highlight the query in the content
            const highlighted = r.content.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (match) => chalk_1.default.bold.yellow(match));
            console.log(`    ${highlighted}`);
        }
        console.log();
        process.exit(0);
    });
}
//# sourceMappingURL=knowledge.js.map