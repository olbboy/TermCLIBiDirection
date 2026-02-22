---
description: Package and release the VS Code extension
---

1. Build all packages first:
// turbo
```bash
npm run build
```

2. Run tests to confirm everything works:
// turbo
```bash
node scripts/test-e2e.js
```

3. Package the extension as .vsix:
// turbo
```bash
cd packages/vscode-extension && npm run package
```

4. Verify the .vsix contents:
// turbo
```bash
unzip -l packages/vscode-extension/bidirection-bridge-*.vsix
```

5. To install locally for testing:
```bash
code --install-extension packages/vscode-extension/bidirection-bridge-*.vsix
```

6. To publish to marketplace (requires PAT):
```bash
cd packages/vscode-extension && npx -y @vscode/vsce publish
```
