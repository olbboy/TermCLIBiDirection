"use strict";
/**
 * Socket Utilities for BiDirection
 *
 * Handles socket discovery, connection management, and message framing
 * for Unix Domain Socket communication.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeClient = exports.MessageReader = exports.BRIDGE_VERSION = exports.BRIDGE_INFO_PATH = exports.BRIDGE_SOCKET_PATH = exports.BRIDGE_DIR = void 0;
exports.scanForVSCodeSockets = scanForVSCodeSockets;
exports.findBridgeSocket = findBridgeSocket;
exports.isSocketAlive = isSocketAlive;
exports.discoverAllSockets = discoverAllSockets;
exports.frameMessage = frameMessage;
exports.getIPCExportCommand = getIPCExportCommand;
exports.generateAutoInjectScript = generateAutoInjectScript;
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// ─── Constants ────────────────────────────────────────────────────────
exports.BRIDGE_DIR = path.join(os.homedir(), '.bidirection');
exports.BRIDGE_SOCKET_PATH = path.join(exports.BRIDGE_DIR, 'bridge.sock');
exports.BRIDGE_INFO_PATH = path.join(exports.BRIDGE_DIR, 'bridge.info');
exports.BRIDGE_VERSION = '1.0.0';
/**
 * Scan for VS Code IPC sockets in typical locations.
 * macOS: $TMPDIR/vscode-ipc-*.sock
 * Linux: /run/user/<uid>/vscode-ipc-*.sock or /tmp/
 */
function scanForVSCodeSockets() {
    const results = [];
    const searchDirs = [];
    if (process.platform === 'darwin') {
        // macOS: use TMPDIR which is per-user
        const tmpDir = process.env.TMPDIR || '/tmp';
        searchDirs.push(tmpDir);
        // Also check common VS Code temp locations
        searchDirs.push(path.join(os.tmpdir()));
    }
    else {
        // Linux
        const uid = process.getuid?.();
        if (uid !== undefined) {
            searchDirs.push(`/run/user/${uid}`);
        }
        searchDirs.push('/tmp');
        searchDirs.push(os.tmpdir());
    }
    // De-duplicate search dirs
    const uniqueDirs = [...new Set(searchDirs.map(d => fs.realpathSync(d)))];
    for (const dir of uniqueDirs) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (file.startsWith('vscode-ipc-') && file.endsWith('.sock')) {
                    const fullPath = path.join(dir, file);
                    try {
                        const stat = fs.statSync(fullPath);
                        results.push({
                            path: fullPath,
                            type: 'vscode-ipc',
                            age: Date.now() - stat.mtimeMs,
                            active: false, // Will be checked later
                        });
                    }
                    catch {
                        // Socket file may have been removed
                    }
                }
            }
        }
        catch {
            // Directory may not exist or not readable
        }
    }
    // Sort by age (newest first)
    results.sort((a, b) => a.age - b.age);
    return results;
}
/**
 * Check if a BiDirection bridge socket is available.
 */
function findBridgeSocket() {
    try {
        // Check the info file first
        if (fs.existsSync(exports.BRIDGE_INFO_PATH)) {
            const info = JSON.parse(fs.readFileSync(exports.BRIDGE_INFO_PATH, 'utf-8'));
            if (info.socketPath && fs.existsSync(info.socketPath)) {
                return {
                    path: info.socketPath,
                    type: 'bidirection-bridge',
                    age: Date.now() - (info.startedAt || Date.now()),
                    active: false, // Will be checked
                };
            }
        }
        // Fallback to default path
        if (fs.existsSync(exports.BRIDGE_SOCKET_PATH)) {
            return {
                path: exports.BRIDGE_SOCKET_PATH,
                type: 'bidirection-bridge',
                age: 0,
                active: false,
            };
        }
    }
    catch {
        // Ignore errors
    }
    return null;
}
/**
 * Test if a socket is alive by attempting to connect and immediately disconnect.
 */
async function isSocketAlive(socketPath, timeoutMs = 2000) {
    return new Promise((resolve) => {
        const client = net.createConnection({ path: socketPath }, () => {
            client.destroy();
            resolve(true);
        });
        client.on('error', () => resolve(false));
        client.setTimeout(timeoutMs, () => {
            client.destroy();
            resolve(false);
        });
    });
}
/**
 * Discover all sockets and check which ones are alive.
 */
async function discoverAllSockets() {
    const sockets = [];
    // Check BiDirection bridge first
    const bridge = findBridgeSocket();
    if (bridge) {
        bridge.active = await isSocketAlive(bridge.path);
        sockets.push(bridge);
    }
    // Then check VS Code IPC sockets
    const vscodeSockets = scanForVSCodeSockets();
    for (const sock of vscodeSockets) {
        sock.active = await isSocketAlive(sock.path);
        sockets.push(sock);
    }
    return sockets;
}
// ─── Message Framing ──────────────────────────────────────────────────
/**
 * Frame a JSON-RPC message for transmission over socket.
 * Format: 4-byte big-endian length prefix + UTF-8 JSON payload
 */
function frameMessage(message) {
    const payload = JSON.stringify(message);
    const payloadBytes = Buffer.from(payload, 'utf-8');
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payloadBytes.length, 0);
    return Buffer.concat([header, payloadBytes]);
}
/**
 * MessageReader: Accumulates incoming data and emits complete framed messages.
 * Handles partial reads and multiple messages in a single data chunk.
 */
class MessageReader {
    constructor(onMessage, onError = () => { }) {
        this.buffer = Buffer.alloc(0);
        this.onMessage = onMessage;
        this.onError = onError;
    }
    /**
     * Feed incoming data from the socket. May trigger zero or more message callbacks.
     */
    feed(data) {
        this.buffer = Buffer.concat([this.buffer, data]);
        while (this.buffer.length >= 4) {
            const payloadLength = this.buffer.readUInt32BE(0);
            // Sanity check: reject messages larger than 50MB
            if (payloadLength > 50 * 1024 * 1024) {
                this.onError(new Error(`Message too large: ${payloadLength} bytes`));
                this.buffer = Buffer.alloc(0);
                return;
            }
            if (this.buffer.length < 4 + payloadLength) {
                // Not enough data yet, wait for more
                break;
            }
            const payload = this.buffer.slice(4, 4 + payloadLength).toString('utf-8');
            this.buffer = this.buffer.slice(4 + payloadLength);
            try {
                const message = JSON.parse(payload);
                this.onMessage(message);
            }
            catch (err) {
                this.onError(new Error(`Failed to parse message: ${err}`));
            }
        }
    }
    /** Reset the internal buffer */
    reset() {
        this.buffer = Buffer.alloc(0);
    }
}
exports.MessageReader = MessageReader;
/**
 * BridgeClient: Connect to the BiDirection bridge extension via Unix Domain Socket.
 * Provides a simple request/response interface over JSON-RPC.
 */
class BridgeClient {
    constructor(options = {}) {
        this.socket = null;
        this.pendingRequests = new Map();
        this.notificationHandlers = new Map();
        this.connected = false;
        this.socketPath = options.socketPath || exports.BRIDGE_SOCKET_PATH;
        this.explicitSocketPath = !!options.socketPath;
        this.timeout = options.timeout || 10000;
        this.reader = new MessageReader((msg) => this.handleMessage(msg), (err) => console.error('[BiDirection] Parse error:', err.message));
    }
    /** Connect to the bridge socket */
    async connect() {
        return new Promise((resolve, reject) => {
            // Only auto-discover from info file if no explicit socketPath was provided
            if (!this.explicitSocketPath) {
                try {
                    if (fs.existsSync(exports.BRIDGE_INFO_PATH)) {
                        const info = JSON.parse(fs.readFileSync(exports.BRIDGE_INFO_PATH, 'utf-8'));
                        if (info.socketPath) {
                            this.socketPath = info.socketPath;
                        }
                    }
                }
                catch { /* use default */ }
            }
            this.socket = net.createConnection({ path: this.socketPath }, () => {
                this.connected = true;
                // Unref socket so it doesn't keep the event loop alive
                // when used in CLI tools that should exit after completing
                this.socket?.unref();
                resolve();
            });
            this.socket.on('data', (data) => this.reader.feed(data));
            this.socket.on('error', (err) => {
                if (!this.connected) {
                    reject(err);
                }
            });
            this.socket.on('close', () => {
                this.connected = false;
                // Reject all pending requests
                for (const [id, pending] of this.pendingRequests) {
                    clearTimeout(pending.timer);
                    pending.reject(new Error('Connection closed'));
                    this.pendingRequests.delete(id);
                }
            });
        });
    }
    /** Send a JSON-RPC request and wait for the response */
    async request(method, params) {
        if (!this.socket || !this.connected) {
            throw new Error('Not connected to bridge');
        }
        const id = Date.now() + Math.random();
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`Request timeout: ${method}`));
            }, this.timeout);
            this.pendingRequests.set(id, {
                resolve: resolve,
                reject,
                timer,
            });
            this.socket.write(frameMessage(message));
        });
    }
    /** Register a handler for server-sent notifications */
    onNotification(method, handler) {
        this.notificationHandlers.set(method, handler);
    }
    /** Disconnect from the bridge */
    disconnect() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
            this.connected = false;
        }
    }
    /** Check if connected */
    isConnected() {
        return this.connected;
    }
    handleMessage(msg) {
        // Response to a pending request
        if ('id' in msg && !('method' in msg)) {
            const pending = this.pendingRequests.get(msg.id);
            if (pending) {
                clearTimeout(pending.timer);
                this.pendingRequests.delete(msg.id);
                if ('error' in msg) {
                    pending.reject(new Error(`${msg.error.message} (code: ${msg.error.code})`));
                }
                else {
                    pending.resolve(msg.result);
                }
            }
            return;
        }
        // Notification from server
        if ('method' in msg && !('id' in msg)) {
            const handler = this.notificationHandlers.get(msg.method);
            if (handler) {
                handler(msg.params);
            }
        }
    }
}
exports.BridgeClient = BridgeClient;
// ─── Utility: Environment Variable Injection ──────────────────────────
/**
 * Get the shell export command for VSCODE_IPC_HOOK_CLI.
 * This allows external terminals to route `code` commands to an existing VS Code window.
 */
function getIPCExportCommand(socketPath) {
    return `export VSCODE_IPC_HOOK_CLI="${socketPath}"`;
}
/**
 * Generate a shell script snippet that auto-discovers and sets VSCODE_IPC_HOOK_CLI.
 */
function generateAutoInjectScript() {
    return `
# BiDirection: Auto-inject VSCODE_IPC_HOOK_CLI
# Add this to your ~/.zshrc or ~/.bashrc
bidirection_inject() {
  local sock
  sock=$(ls -t \${TMPDIR:-/tmp}/vscode-ipc-*.sock 2>/dev/null | head -1)
  if [ -n "$sock" ] && [ -S "$sock" ]; then
    export VSCODE_IPC_HOOK_CLI="$sock"
  fi
}
bidirection_inject
`.trim();
}
//# sourceMappingURL=socket-utils.js.map