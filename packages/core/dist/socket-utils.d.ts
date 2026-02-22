/**
 * Socket Utilities for BiDirection
 *
 * Handles socket discovery, connection management, and message framing
 * for Unix Domain Socket communication.
 */
import { JsonRpcMessage } from './protocol';
export declare const BRIDGE_DIR: string;
export declare const BRIDGE_SOCKET_PATH: string;
export declare const BRIDGE_INFO_PATH: string;
export declare const BRIDGE_VERSION = "1.0.0";
export interface DiscoveredSocket {
    path: string;
    type: 'vscode-ipc' | 'bidirection-bridge';
    age: number;
    active: boolean;
}
/**
 * Scan for VS Code IPC sockets in typical locations.
 * macOS: $TMPDIR/vscode-ipc-*.sock
 * Linux: /run/user/<uid>/vscode-ipc-*.sock or /tmp/
 */
export declare function scanForVSCodeSockets(): DiscoveredSocket[];
/**
 * Check if a BiDirection bridge socket is available.
 */
export declare function findBridgeSocket(): DiscoveredSocket | null;
/**
 * Test if a socket is alive by attempting to connect and immediately disconnect.
 */
export declare function isSocketAlive(socketPath: string, timeoutMs?: number): Promise<boolean>;
/**
 * Discover all sockets and check which ones are alive.
 */
export declare function discoverAllSockets(): Promise<DiscoveredSocket[]>;
/**
 * Frame a JSON-RPC message for transmission over socket.
 * Format: 4-byte big-endian length prefix + UTF-8 JSON payload
 */
export declare function frameMessage(message: JsonRpcMessage): Buffer;
/**
 * MessageReader: Accumulates incoming data and emits complete framed messages.
 * Handles partial reads and multiple messages in a single data chunk.
 */
export declare class MessageReader {
    private buffer;
    private onMessage;
    private onError;
    constructor(onMessage: (msg: JsonRpcMessage) => void, onError?: (error: Error) => void);
    /**
     * Feed incoming data from the socket. May trigger zero or more message callbacks.
     */
    feed(data: Buffer): void;
    /** Reset the internal buffer */
    reset(): void;
}
export interface BridgeClientOptions {
    socketPath?: string;
    timeout?: number;
    autoReconnect?: boolean;
}
/**
 * BridgeClient: Connect to the BiDirection bridge extension via Unix Domain Socket.
 * Provides a simple request/response interface over JSON-RPC.
 */
export declare class BridgeClient {
    private socket;
    private reader;
    private pendingRequests;
    private notificationHandlers;
    private socketPath;
    private timeout;
    private connected;
    private explicitSocketPath;
    constructor(options?: BridgeClientOptions);
    /** Connect to the bridge socket */
    connect(): Promise<void>;
    /** Send a JSON-RPC request and wait for the response */
    request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    /** Register a handler for server-sent notifications */
    onNotification(method: string, handler: (params: unknown) => void): void;
    /** Disconnect from the bridge */
    disconnect(): void;
    /** Check if connected */
    isConnected(): boolean;
    private handleMessage;
}
/**
 * Get the shell export command for VSCODE_IPC_HOOK_CLI.
 * This allows external terminals to route `code` commands to an existing VS Code window.
 */
export declare function getIPCExportCommand(socketPath: string): string;
/**
 * Generate a shell script snippet that auto-discovers and sets VSCODE_IPC_HOOK_CLI.
 */
export declare function generateAutoInjectScript(): string;
//# sourceMappingURL=socket-utils.d.ts.map