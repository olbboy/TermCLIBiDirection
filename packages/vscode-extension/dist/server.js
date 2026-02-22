"use strict";
/**
 * BiDirection Bridge Server
 *
 * Unix Domain Socket server that listens for JSON-RPC messages
 * from external terminals and dispatches them to handlers.
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
exports.BridgeServer = void 0;
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
const core_1 = require("@bidirection/core");
class BridgeServer {
    constructor(socketPath, onLog = console.log) {
        this.server = null;
        this.clients = new Map();
        this.handlers = new Map();
        this.nextClientId = 1;
        this.socketPath = socketPath || core_1.BRIDGE_SOCKET_PATH;
        this.onLog = onLog;
    }
    /** Register a handler for a JSON-RPC method */
    registerHandler(method, handler) {
        this.handlers.set(method, handler);
    }
    /** Start the Unix Socket server */
    async start() {
        // Ensure bridge directory exists
        if (!fs.existsSync(core_1.BRIDGE_DIR)) {
            fs.mkdirSync(core_1.BRIDGE_DIR, { recursive: true, mode: 0o700 });
        }
        // Clean up stale socket file
        if (fs.existsSync(this.socketPath)) {
            try {
                fs.unlinkSync(this.socketPath);
            }
            catch {
                throw new Error(`Cannot remove stale socket: ${this.socketPath}`);
            }
        }
        return new Promise((resolve, reject) => {
            this.server = net.createServer((socket) => this.handleConnection(socket));
            this.server.on('error', (err) => {
                this.onLog(`[BiDirection] Server error: ${err.message}`);
                reject(err);
            });
            this.server.listen(this.socketPath, () => {
                // Secure the socket file (owner read/write only)
                try {
                    fs.chmodSync(this.socketPath, 0o600);
                }
                catch {
                    // May fail on some systems, non-critical
                }
                // Write bridge info file for CLI discovery
                this.writeBridgeInfo();
                this.onLog(`[BiDirection] Bridge server started at ${this.socketPath}`);
                resolve();
            });
        });
    }
    /** Stop the server and disconnect all clients */
    stop() {
        // Disconnect all clients
        for (const [, client] of this.clients) {
            client.socket.destroy();
        }
        this.clients.clear();
        // Close server
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        // Clean up socket file
        try {
            if (fs.existsSync(this.socketPath)) {
                fs.unlinkSync(this.socketPath);
            }
            if (fs.existsSync(core_1.BRIDGE_INFO_PATH)) {
                fs.unlinkSync(core_1.BRIDGE_INFO_PATH);
            }
        }
        catch {
            // Best effort cleanup
        }
        this.onLog('[BiDirection] Bridge server stopped');
    }
    /** Send a notification to all connected clients */
    broadcast(method, params) {
        const notification = (0, core_1.createNotification)(method, params);
        const frame = (0, core_1.frameMessage)(notification);
        for (const [, client] of this.clients) {
            try {
                client.socket.write(frame);
            }
            catch {
                // Client may have disconnected
            }
        }
    }
    /** Get number of connected clients */
    getClientCount() {
        return this.clients.size;
    }
    /** Get the socket path */
    getSocketPath() {
        return this.socketPath;
    }
    handleConnection(socket) {
        const clientId = this.nextClientId++;
        const reader = new core_1.MessageReader((msg) => this.handleMessage(clientId, msg), (err) => this.onLog(`[BiDirection] Client ${clientId} parse error: ${err.message}`));
        const client = {
            id: clientId,
            socket,
            reader,
            subscribedNotifications: new Set(),
        };
        this.clients.set(clientId, client);
        this.onLog(`[BiDirection] Client ${clientId} connected (total: ${this.clients.size})`);
        socket.on('data', (data) => reader.feed(data));
        socket.on('close', () => {
            this.clients.delete(clientId);
            this.onLog(`[BiDirection] Client ${clientId} disconnected (total: ${this.clients.size})`);
        });
        socket.on('error', (err) => {
            this.onLog(`[BiDirection] Client ${clientId} error: ${err.message}`);
            this.clients.delete(clientId);
        });
    }
    async handleMessage(clientId, msg) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        if ((0, core_1.isRequest)(msg)) {
            await this.handleRequest(client, msg);
        }
        else if ((0, core_1.isNotification)(msg)) {
            // Client-sent notifications (e.g., subscribe to events)
            this.onLog(`[BiDirection] Notification from client ${clientId}: ${msg.method}`);
        }
    }
    async handleRequest(client, request) {
        const startTime = Date.now();
        let response;
        // Special built-in handler: ping
        if (request.method === 'ping') {
            response = (0, core_1.createSuccessResponse)(request.id, {
                pong: true,
                timestamp: Date.now(),
                version: core_1.BRIDGE_VERSION,
            });
        }
        else {
            const handler = this.handlers.get(request.method);
            if (!handler) {
                response = (0, core_1.createErrorResponse)(request.id, core_1.ErrorCodes.METHOD_NOT_FOUND, `Method not found: ${request.method}`);
            }
            else {
                try {
                    const result = await handler(request.params);
                    response = (0, core_1.createSuccessResponse)(request.id, result);
                }
                catch (err) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    response = (0, core_1.createErrorResponse)(request.id, core_1.ErrorCodes.INTERNAL_ERROR, error.message);
                }
            }
        }
        const elapsed = Date.now() - startTime;
        this.onLog(`[BiDirection] ${request.method} → ${elapsed}ms`);
        try {
            client.socket.write((0, core_1.frameMessage)(response));
        }
        catch {
            this.onLog(`[BiDirection] Failed to send response to client ${client.id}`);
        }
    }
    writeBridgeInfo() {
        const info = {
            socketPath: this.socketPath,
            version: core_1.BRIDGE_VERSION,
            pid: process.pid,
            startedAt: Date.now(),
        };
        try {
            fs.writeFileSync(core_1.BRIDGE_INFO_PATH, JSON.stringify(info, null, 2), {
                mode: 0o600,
            });
        }
        catch {
            this.onLog('[BiDirection] Warning: Could not write bridge.info');
        }
    }
}
exports.BridgeServer = BridgeServer;
//# sourceMappingURL=server.js.map