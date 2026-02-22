#!/usr/bin/env node
/**
 * BiDirection End-to-End Integration Test
 * 
 * Tests the core bridge communication (server + client) WITHOUT VS Code.
 * Spins up a BridgeServer with mock handlers, connects a BridgeClient,
 * and verifies JSON-RPC request/response round-trips.
 * 
 * Usage: node scripts/test-e2e.js
 */

const net = require('net');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import from built packages
const {
    BridgeClient,
    Methods,
    frameMessage,
    MessageReader,
    createRequest,
    createSuccessResponse,
    createErrorResponse,
    createNotification,
    isRequest,
    BRIDGE_DIR,
    BRIDGE_INFO_PATH,
    BRIDGE_VERSION,
} = require(path.join(__dirname, '..', 'packages', 'core', 'dist', 'index'));

// ─── Test Configuration ───────────────────────────────────────────────

const TEST_SOCKET_PATH = path.join(os.tmpdir(), `bidirection-test-${process.pid}.sock`);
const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;
let testServer = null;

// ─── Mock Data ────────────────────────────────────────────────────────

const MOCK_EDITOR_TEXT = `function hello() {
  console.log("Hello from BiDirection!");
  return 42;
}

export default hello;
`;

const MOCK_FILE_URI = '/Users/test/project/src/main.ts';
const MOCK_DIAGNOSTICS = [
    {
        uri: MOCK_FILE_URI,
        line: 1,
        character: 2,
        endLine: 1,
        endCharacter: 15,
        message: "Unexpected console statement",
        severity: 'warning',
        source: 'eslint',
    },
];
const MOCK_OPEN_FILES = [
    { uri: MOCK_FILE_URI, isActive: true, isDirty: false, languageId: 'typescript' },
    { uri: '/Users/test/project/README.md', isActive: false, isDirty: true, languageId: 'markdown' },
];

// ─── Mock Bridge Server ───────────────────────────────────────────────

function createMockServer() {
    return new Promise((resolve, reject) => {
        // Cleanup stale socket
        try { fs.unlinkSync(TEST_SOCKET_PATH); } catch { }

        // Ensure bridge dir exists for info file
        if (!fs.existsSync(BRIDGE_DIR)) {
            fs.mkdirSync(BRIDGE_DIR, { recursive: true });
        }

        const server = net.createServer((socket) => {
            const reader = new MessageReader((msg) => {
                if (!isRequest(msg)) return;

                let response;

                switch (msg.method) {
                    case 'ping':
                        response = createSuccessResponse(msg.id, {
                            pong: true,
                            timestamp: Date.now(),
                            version: BRIDGE_VERSION,
                        });
                        break;

                    case Methods.GET_INFO:
                        response = createSuccessResponse(msg.id, {
                            name: 'BiDirection Bridge (Mock)',
                            version: BRIDGE_VERSION,
                            ide: 'mock-vscode',
                            ideVersion: '1.85.0',
                            socketPath: TEST_SOCKET_PATH,
                            pid: process.pid,
                            workspaceFolders: ['/Users/test/project'],
                        });
                        break;

                    case Methods.EDITOR_GET_TEXT:
                        response = createSuccessResponse(msg.id, {
                            text: MOCK_EDITOR_TEXT,
                            uri: msg.params?.uri || MOCK_FILE_URI,
                            languageId: 'typescript',
                            lineCount: MOCK_EDITOR_TEXT.split('\n').length,
                        });
                        break;

                    case Methods.EDITOR_GET_SELECTION:
                        response = createSuccessResponse(msg.id, {
                            text: 'console.log("Hello from BiDirection!")',
                            uri: MOCK_FILE_URI,
                            startLine: 1,
                            startCharacter: 2,
                            endLine: 1,
                            endCharacter: 40,
                        });
                        break;

                    case Methods.EDITOR_SET_CURSOR:
                        response = createSuccessResponse(msg.id, { success: true });
                        break;

                    case Methods.EDITOR_APPLY_EDIT:
                        response = createSuccessResponse(msg.id, {
                            success: true,
                            uri: msg.params?.uri || MOCK_FILE_URI,
                        });
                        break;

                    case Methods.EDITOR_HIGHLIGHT:
                        response = createSuccessResponse(msg.id, { success: true });
                        break;

                    case Methods.WORKSPACE_OPEN_FILE:
                        response = createSuccessResponse(msg.id, {
                            success: true,
                            uri: msg.params?.uri || MOCK_FILE_URI,
                        });
                        break;

                    case Methods.WORKSPACE_GET_DIAGNOSTICS:
                        response = createSuccessResponse(msg.id, {
                            diagnostics: MOCK_DIAGNOSTICS,
                        });
                        break;

                    case Methods.WORKSPACE_GET_OPEN_FILES:
                        response = createSuccessResponse(msg.id, {
                            files: MOCK_OPEN_FILES,
                        });
                        break;

                    case Methods.COMMAND_EXECUTE:
                        response = createSuccessResponse(msg.id, {
                            result: `Executed: ${msg.params?.command}`,
                        });
                        break;

                    case Methods.TERMINAL_SEND_TEXT:
                        response = createSuccessResponse(msg.id, { success: true });
                        break;

                    case Methods.WINDOW_SHOW_MESSAGE:
                        response = createSuccessResponse(msg.id, {
                            selectedAction: msg.params?.actions?.[0] || undefined,
                        });
                        break;

                    default:
                        response = createErrorResponse(msg.id, -32601, `Method not found: ${msg.method}`);
                }

                socket.write(frameMessage(response));
            });

            socket.on('data', (data) => reader.feed(data));
        });

        server.listen(TEST_SOCKET_PATH, () => {
            // Write bridge info so BridgeClient can discover it
            const info = {
                socketPath: TEST_SOCKET_PATH,
                version: BRIDGE_VERSION,
                pid: process.pid,
                startedAt: Date.now(),
            };
            fs.writeFileSync(BRIDGE_INFO_PATH, JSON.stringify(info, null, 2));

            resolve(server);
        });

        server.on('error', reject);
    });
}

// ─── Test Utilities ───────────────────────────────────────────────────

function log(icon, color, msg) {
    console.log(`  ${COLORS[color]}${icon}${COLORS.reset} ${msg}`);
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        log('✓', 'green', name);
    } catch (err) {
        failed++;
        log('✗', 'red', `${name}`);
        log(' ', 'red', `  ${err.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Not equal'}: expected "${expected}", got "${actual}"`);
    }
}

function assertIncludes(haystack, needle, message) {
    if (!haystack.includes(needle)) {
        throw new Error(`${message || 'Not found'}: "${needle}" not in "${haystack.substring(0, 100)}..."`);
    }
}

// ─── Test: Message Framing ────────────────────────────────────────────

async function testMessageFraming() {
    console.log(`\n${COLORS.bold}${COLORS.cyan}═══ Test: Message Framing ═══${COLORS.reset}\n`);

    await test('frameMessage creates correct buffer', () => {
        const msg = createRequest('ping');
        const frame = frameMessage(msg);
        const payloadLen = frame.readUInt32BE(0);
        const payload = frame.slice(4).toString('utf-8');
        const parsed = JSON.parse(payload);
        assertEqual(payloadLen, Buffer.byteLength(payload), 'Length prefix mismatch');
        assertEqual(parsed.method, 'ping', 'Method mismatch');
        assertEqual(parsed.jsonrpc, '2.0', 'jsonrpc version');
    });

    await test('MessageReader handles complete messages', () => {
        return new Promise((resolve, reject) => {
            const messages = [];
            const reader = new MessageReader((msg) => messages.push(msg));

            const msg1 = createRequest('test1');
            const msg2 = createRequest('test2');
            reader.feed(frameMessage(msg1));
            reader.feed(frameMessage(msg2));

            assertEqual(messages.length, 2, 'Should receive 2 messages');
            assertEqual(messages[0].method, 'test1', 'First message method');
            assertEqual(messages[1].method, 'test2', 'Second message method');
            resolve();
        });
    });

    await test('MessageReader handles split messages', () => {
        return new Promise((resolve, reject) => {
            const messages = [];
            const reader = new MessageReader((msg) => messages.push(msg));

            const frame = frameMessage(createRequest('splitTest'));
            // Split in the middle
            const mid = Math.floor(frame.length / 2);
            reader.feed(frame.slice(0, mid));
            assertEqual(messages.length, 0, 'Should not emit yet');
            reader.feed(frame.slice(mid));
            assertEqual(messages.length, 1, 'Should emit after complete');
            assertEqual(messages[0].method, 'splitTest', 'Method');
            resolve();
        });
    });

    await test('MessageReader handles concatenated messages', () => {
        return new Promise((resolve, reject) => {
            const messages = [];
            const reader = new MessageReader((msg) => messages.push(msg));

            const frame1 = frameMessage(createRequest('concat1'));
            const frame2 = frameMessage(createRequest('concat2'));
            reader.feed(Buffer.concat([frame1, frame2]));

            assertEqual(messages.length, 2, 'Should receive 2 messages from one buffer');
            resolve();
        });
    });
}

// ─── Test: BridgeClient + Server ──────────────────────────────────────

async function testBridgeClientServer() {
    console.log(`\n${COLORS.bold}${COLORS.cyan}═══ Test: Bridge Client ↔ Server ═══${COLORS.reset}\n`);

    await test('Client connects to mock server', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        assert(client.isConnected(), 'Should be connected');
        client.disconnect();
    });

    await test('ping returns pong with version', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request('ping');
            assertEqual(result.pong, true, 'Should return pong');
            assert(result.timestamp > 0, 'Should have timestamp');
            assertEqual(result.version, BRIDGE_VERSION, 'Version mismatch');
        } finally {
            client.disconnect();
        }
    });

    await test('getInfo returns bridge metadata', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.GET_INFO);
            assertEqual(result.ide, 'mock-vscode', 'IDE name');
            assertEqual(result.name, 'BiDirection Bridge (Mock)', 'Bridge name');
            assert(result.workspaceFolders.length > 0, 'Should have workspaces');
        } finally {
            client.disconnect();
        }
    });

    await test('editor/getText returns file content', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.EDITOR_GET_TEXT);
            assertIncludes(result.text, 'Hello from BiDirection', 'Content');
            assertEqual(result.languageId, 'typescript', 'Language');
            assert(result.lineCount > 0, 'Should have lines');
        } finally {
            client.disconnect();
        }
    });

    await test('editor/getSelection returns selection range', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.EDITOR_GET_SELECTION);
            assertIncludes(result.text, 'console.log', 'Selection text');
            assertEqual(result.startLine, 1, 'Start line');
        } finally {
            client.disconnect();
        }
    });

    await test('editor/setCursor succeeds', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.EDITOR_SET_CURSOR, {
                line: 5, character: 0,
            });
            assertEqual(result.success, true, 'Should succeed');
        } finally {
            client.disconnect();
        }
    });

    await test('editor/applyEdit succeeds', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.EDITOR_APPLY_EDIT, {
                uri: MOCK_FILE_URI,
                edits: [{
                    startLine: 1, startCharacter: 0,
                    endLine: 1, endCharacter: 40,
                    newText: '  console.log("Edited!");',
                }],
            });
            assertEqual(result.success, true, 'Should succeed');
        } finally {
            client.disconnect();
        }
    });

    await test('editor/highlight succeeds', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.EDITOR_HIGHLIGHT, {
                startLine: 0, endLine: 2, color: 'rgba(255,0,0,0.3)',
            });
            assertEqual(result.success, true, 'Should succeed');
        } finally {
            client.disconnect();
        }
    });

    await test('workspace/openFile succeeds', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.WORKSPACE_OPEN_FILE, {
                uri: MOCK_FILE_URI, line: 10,
            });
            assertEqual(result.success, true, 'Should succeed');
        } finally {
            client.disconnect();
        }
    });

    await test('workspace/getDiagnostics returns diagnostics', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.WORKSPACE_GET_DIAGNOSTICS);
            assert(result.diagnostics.length > 0, 'Should have diagnostics');
            assertEqual(result.diagnostics[0].severity, 'warning', 'Severity');
            assertIncludes(result.diagnostics[0].message, 'console', 'Message');
        } finally {
            client.disconnect();
        }
    });

    await test('workspace/getOpenFiles returns file list', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.WORKSPACE_GET_OPEN_FILES);
            assertEqual(result.files.length, 2, 'Should have 2 files');
            assert(result.files[0].isActive, 'First file should be active');
            assert(result.files[1].isDirty, 'Second file should be dirty');
        } finally {
            client.disconnect();
        }
    });

    await test('command/execute returns result', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const result = await client.request(Methods.COMMAND_EXECUTE, {
                command: 'editor.action.formatDocument',
            });
            assertIncludes(String(result.result), 'formatDocument', 'Result');
        } finally {
            client.disconnect();
        }
    });

    await test('unknown method returns METHOD_NOT_FOUND error', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            await client.request('nonexistent/method');
            throw new Error('Should have thrown');
        } catch (err) {
            assertIncludes(err.message, 'Method not found', 'Error message');
        } finally {
            client.disconnect();
        }
    });

    await test('Multiple concurrent requests work', async () => {
        const client = new BridgeClient({ socketPath: TEST_SOCKET_PATH });
        await client.connect();
        try {
            const [r1, r2, r3] = await Promise.all([
                client.request('ping'),
                client.request(Methods.EDITOR_GET_TEXT),
                client.request(Methods.WORKSPACE_GET_OPEN_FILES),
            ]);
            assertEqual(r1.pong, true, 'Ping');
            assertIncludes(r2.text, 'Hello', 'Text');
            assert(r3.files.length > 0, 'Files');
        } finally {
            client.disconnect();
        }
    });
}

// ─── Test: CLI via exec ───────────────────────────────────────────────

async function testCLI() {
    console.log(`\n${COLORS.bold}${COLORS.cyan}═══ Test: CLI Commands ═══${COLORS.reset}\n`);

    const { spawn } = require('child_process');
    const cliPath = path.join(__dirname, '..', 'packages', 'cli', 'dist', 'index.js');

    function runCLI(args, useSocket = true) {
        return new Promise((resolve, reject) => {
            const argArr = args.split(/\s+/).filter(Boolean);
            if (useSocket) argArr.push('--socket', TEST_SOCKET_PATH);

            const child = spawn('node', [cliPath, ...argArr], {
                env: { ...process.env, FORCE_COLOR: '0' },
                stdio: 'pipe',
            });

            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => { stdout += data.toString(); });
            child.stderr.on('data', (data) => { stderr += data.toString(); });

            const timer = setTimeout(() => {
                child.kill();
                reject(new Error('CLI timeout after 5s'));
            }, 5000);

            child.on('exit', (code) => {
                clearTimeout(timer);
                if (code !== 0 && stderr) {
                    reject(new Error(stderr.trim()));
                } else {
                    resolve(stdout.trim());
                }
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }

    function cli(args) { return runCLI(args, true); }
    function cliNoSocket(args) { return runCLI(args, false); }

    await test('CLI: --help shows all commands', async () => {
        const output = await cliNoSocket('--help');
        assertIncludes(output, 'discover', 'discover command');
        assertIncludes(output, 'read', 'read command');
        assertIncludes(output, 'open', 'open command');
        assertIncludes(output, 'highlight', 'highlight command');
        assertIncludes(output, 'exec', 'exec command');
    });

    await test('CLI: ping succeeds', async () => {
        const output = await cli('ping');
        assertIncludes(output, 'pong', 'Should pong');
    });

    await test('CLI: info shows bridge metadata', async () => {
        const output = await cli('info');
        assertIncludes(output, 'mock-vscode', 'IDE name');
        assertIncludes(output, 'BiDirection', 'Bridge name');
    });

    await test('CLI: read returns file content', async () => {
        const output = await cli('read');
        assertIncludes(output, 'Hello from BiDirection', 'Content');
    });

    await test('CLI: read --json returns JSON', async () => {
        const output = await cli('read --json');
        const parsed = JSON.parse(output);
        assertEqual(parsed.languageId, 'typescript', 'Language');
        assertIncludes(parsed.text, 'Hello from BiDirection', 'Text');
    });

    await test('CLI: read --selection returns selection', async () => {
        const output = await cli('read --selection');
        assertIncludes(output, 'console.log', 'Selection');
    });

    await test('CLI: diagnostics shows warnings', async () => {
        const output = await cli('diagnostics');
        assertIncludes(output, 'console', 'Diagnostic message');
    });

    await test('CLI: diagnostics --json returns JSON', async () => {
        const output = await cli('diagnostics --json');
        const parsed = JSON.parse(output);
        assert(parsed.diagnostics.length > 0, 'Should have diagnostics');
    });

    await test('CLI: files lists open files', async () => {
        const output = await cli('files');
        assertIncludes(output, 'main.ts', 'File name');
        assertIncludes(output, 'README.md', 'Second file');
    });

    await test('CLI: files --json returns JSON', async () => {
        const output = await cli('files --json');
        const parsed = JSON.parse(output);
        assertEqual(parsed.files.length, 2, 'File count');
    });

    await test('CLI: exec runs command', async () => {
        const output = await cli('exec editor.action.formatDocument');
        assertIncludes(output, 'Executed', 'Executed confirmation');
    });

    await test('CLI: discover runs without error', async () => {
        const output = await cliNoSocket('discover');
        // May or may not find sockets, but should not crash
        assert(output.length > 0, 'Should produce output');
    });

    await test('CLI: inject --auto generates script', async () => {
        const output = await cliNoSocket('inject --auto');
        assertIncludes(output, 'VSCODE_IPC_HOOK_CLI', 'Export variable');
        assertIncludes(output, 'bidirection_inject', 'Function name');
    });
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
    console.log(`${COLORS.bold}${COLORS.cyan}`);
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   BiDirection End-to-End Integration Tests       ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(COLORS.reset);
    console.log(`${COLORS.dim}Socket: ${TEST_SOCKET_PATH}${COLORS.reset}`);

    try {
        // Start mock server
        testServer = await createMockServer();
        log('▸', 'cyan', `Mock bridge server started at ${TEST_SOCKET_PATH}`);

        // Run test suites
        await testMessageFraming();
        await testBridgeClientServer();
        await testCLI();

    } catch (err) {
        console.error(`\n${COLORS.red}Fatal error: ${err.message}${COLORS.reset}`);
        console.error(err.stack);
    } finally {
        // Cleanup
        if (testServer) testServer.close();
        try { fs.unlinkSync(TEST_SOCKET_PATH); } catch { }
        try { fs.unlinkSync(BRIDGE_INFO_PATH); } catch { }
    }

    // Summary
    const total = passed + failed;
    console.log(`\n${COLORS.bold}═══ Results ═══${COLORS.reset}`);
    console.log(`  Total:  ${total}`);
    console.log(`  ${COLORS.green}Passed: ${passed}${COLORS.reset}`);
    if (failed > 0) {
        console.log(`  ${COLORS.red}Failed: ${failed}${COLORS.reset}`);
    }
    console.log('');

    process.exit(failed > 0 ? 1 : 0);
}

main();
