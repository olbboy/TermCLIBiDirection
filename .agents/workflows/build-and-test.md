---
description: Build, test and verify all BiDirection packages
---

// turbo-all

1. Build core package first (shared types and utilities):
```bash
npm run build:core
```

2. Build CLI package:
```bash
npm run build:cli
```

3. Build VS Code extension (esbuild):
```bash
npm run build:ext
```

4. Run end-to-end integration tests (31 tests, all must pass):
```bash
node scripts/test-e2e.js
```

5. Verify CLI is working:
```bash
node packages/cli/dist/index.js --help
```

6. Link CLI globally (if needed):
```bash
npm link -w packages/cli
```
