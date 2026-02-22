---
description: Add a new CLI command group to BiDirection
---

1. Create the command file at `packages/cli/src/commands/<name>.ts` with this structure:
```typescript
import { Command } from 'commander';
import chalk from 'chalk';

export function register<Name>Commands(program: Command): void {
    const cmd = program
        .command('<name>')
        .description('Description');

    cmd
        .command('list')
        .description('List items')
        .action(() => {
            // implementation
            process.exit(0);
        });
}
```

2. Register the command in `packages/cli/src/index.ts`:
- Add import: `import { register<Name>Commands } from './commands/<name>';`
- Add registration: `register<Name>Commands(program);`

3. Build and test:
// turbo
```bash
npm run build:core && npm run build:cli
```

4. Verify the new command appears:
// turbo
```bash
node packages/cli/dist/index.js --help
```

5. Run E2E tests to confirm no regressions:
// turbo
```bash
node scripts/test-e2e.js
```
