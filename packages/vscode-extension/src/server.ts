/**
 * BiDirection Bridge Server
 * 
 * Unix Domain Socket server that listens for JSON-RPC messages
 * from external terminals and dispatches them to handlers.
 */

import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import {
    JsonRpcMessage,
    JsonRpcRequest,
    JsonRpcResponse,
    MessageReader,
    frameMessage,
    createSuccessResponse,
    createErrorResponse,
    createNotification,
    ErrorCodes,
    isRequest,
    isNotification,
    BRIDGE_DIR,
    BRIDGE_SOCKET_PATH,
    BRIDGE_INFO_PATH,
    BRIDGE_VERSION,
} from '@bidirection/core';

export type RequestHandler = (params: Record<string, unknown> | undefined) => Promise<unknown>;
export type NotificationCallback = (method: string, params: unknown) => void;

interface ClientConnection {
    id: number;
    socket: net.Socket;
    reader: MessageReader;
    subscribedNotifications: Set<string>;
}

export class BridgeServer {
    private server: net.Server | null = null;
    private clients: Map<number, ClientConnection> = new Map();
    private handlers: Map<string, RequestHandler> = new Map();
    private nextClientId = 1;
    private socketPath: string;
    private onLog: (msg: string) => void;

    constructor(
        socketPath?: string,
        onLog: (msg: string) => void = console.log
    ) {
        this.socketPath = socketPath || BRIDGE_SOCKET_PATH;
        this.onLog = onLog;
    }

    /** Register a handler for a JSON-RPC method */
    registerHandler(method: string, handler: RequestHandler): void {
        this.handlers.set(method, handler);
    }

    /** Start the Unix Socket server */
    async start(): Promise<void> {
        // Ensure bridge directory exists
        if (!fs.existsSync(BRIDGE_DIR)) {
            fs.mkdirSync(BRIDGE_DIR, { recursive: true, mode: 0o700 });
        }

        // Clean up stale socket file
        if (fs.existsSync(this.socketPath)) {
            try {
                fs.unlinkSync(this.socketPath);
            } catch {
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
                } catch {
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
    stop(): void {
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
            if (fs.existsSync(BRIDGE_INFO_PATH)) {
                fs.unlinkSync(BRIDGE_INFO_PATH);
            }
        } catch {
            // Best effort cleanup
        }

        this.onLog('[BiDirection] Bridge server stopped');
    }

    /** Send a notification to all connected clients */
    broadcast(method: string, params?: Record<string, unknown>): void {
        const notification = createNotification(method, params);
        const frame = frameMessage(notification);

        for (const [, client] of this.clients) {
            try {
                client.socket.write(frame);
            } catch {
                // Client may have disconnected
            }
        }
    }

    /** Get number of connected clients */
    getClientCount(): number {
        return this.clients.size;
    }

    /** Get the socket path */
    getSocketPath(): string {
        return this.socketPath;
    }

    private handleConnection(socket: net.Socket): void {
        const clientId = this.nextClientId++;
        const reader = new MessageReader(
            (msg) => this.handleMessage(clientId, msg),
            (err) => this.onLog(`[BiDirection] Client ${clientId} parse error: ${err.message}`)
        );

        const client: ClientConnection = {
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

    private async handleMessage(clientId: number, msg: JsonRpcMessage): Promise<void> {
        const client = this.clients.get(clientId);
        if (!client) return;

        if (isRequest(msg)) {
            await this.handleRequest(client, msg as JsonRpcRequest);
        } else if (isNotification(msg)) {
            // Client-sent notifications (e.g., subscribe to events)
            this.onLog(`[BiDirection] Notification from client ${clientId}: ${msg.method}`);
        }
    }

    private async handleRequest(client: ClientConnection, request: JsonRpcRequest): Promise<void> {
        const startTime = Date.now();
        let response: JsonRpcResponse;

        // Special built-in handler: ping
        if (request.method === 'ping') {
            response = createSuccessResponse(request.id, {
                pong: true,
                timestamp: Date.now(),
                version: BRIDGE_VERSION,
            });
        } else {
            const handler = this.handlers.get(request.method);
            if (!handler) {
                response = createErrorResponse(
                    request.id,
                    ErrorCodes.METHOD_NOT_FOUND,
                    `Method not found: ${request.method}`
                );
            } else {
                try {
                    const result = await handler(request.params as Record<string, unknown> | undefined);
                    response = createSuccessResponse(request.id, result);
                } catch (err: unknown) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    response = createErrorResponse(
                        request.id,
                        ErrorCodes.INTERNAL_ERROR,
                        error.message
                    );
                }
            }
        }

        const elapsed = Date.now() - startTime;
        this.onLog(`[BiDirection] ${request.method} → ${elapsed}ms`);

        try {
            client.socket.write(frameMessage(response));
        } catch {
            this.onLog(`[BiDirection] Failed to send response to client ${client.id}`);
        }
    }

    private writeBridgeInfo(): void {
        const info = {
            socketPath: this.socketPath,
            version: BRIDGE_VERSION,
            pid: process.pid,
            startedAt: Date.now(),
        };
        try {
            fs.writeFileSync(BRIDGE_INFO_PATH, JSON.stringify(info, null, 2), {
                mode: 0o600,
            });
        } catch {
            this.onLog('[BiDirection] Warning: Could not write bridge.info');
        }
    }
}
