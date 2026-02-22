/**
 * BiDirection Bridge Server
 *
 * Unix Domain Socket server that listens for JSON-RPC messages
 * from external terminals and dispatches them to handlers.
 */
export type RequestHandler = (params: Record<string, unknown> | undefined) => Promise<unknown>;
export type NotificationCallback = (method: string, params: unknown) => void;
export declare class BridgeServer {
    private server;
    private clients;
    private handlers;
    private nextClientId;
    private socketPath;
    private onLog;
    constructor(socketPath?: string, onLog?: (msg: string) => void);
    /** Register a handler for a JSON-RPC method */
    registerHandler(method: string, handler: RequestHandler): void;
    /** Start the Unix Socket server */
    start(): Promise<void>;
    /** Stop the server and disconnect all clients */
    stop(): void;
    /** Send a notification to all connected clients */
    broadcast(method: string, params?: Record<string, unknown>): void;
    /** Get number of connected clients */
    getClientCount(): number;
    /** Get the socket path */
    getSocketPath(): string;
    private handleConnection;
    private handleMessage;
    private handleRequest;
    private writeBridgeInfo;
}
//# sourceMappingURL=server.d.ts.map