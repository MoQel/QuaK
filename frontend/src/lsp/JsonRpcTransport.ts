/**
 * Layer 1: JsonRpcTransport
 *
 * Responsibilities:
 *  - WebSocket lifecycle
 *  - JSON-RPC framing
 *  - Request/response correlation
 *  - Notification dispatch
 */

const JSON_RPC_VERSION = '2.0';
type JsonRpcVersion = typeof JSON_RPC_VERSION;

export type RpcNotificationHandler = (method: string, params: unknown) => void;
export type TransportState = 'disconnected' | 'connecting' | 'connected' | 'disposed';

interface PendingRequest {
    resolve: (result: unknown) => void;
    reject: (error: RpcError) => void;
    timeoutHandle?: ReturnType<typeof setTimeout>;
}

interface JsonRpcRequest {
    jsonrpc: JsonRpcVersion;
    id: number;
    method: string;
    params?: unknown;
}

interface JsonRpcNotification {
    jsonrpc: JsonRpcVersion;
    method: string;
    params?: unknown;
}

interface JsonRpcResponse {
    jsonrpc: JsonRpcVersion;
    id: number;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
}

type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

export const enum RpcErrorCode {
    TransportDisconnected = -32000,
    RequestTimeout = -32001,
    SendFailed = -32002,
    SendQueueOverflow = -32003,
    TransportDisposed = -1,
}

export class RpcError extends Error {
    constructor(
        public readonly code: number,
        message: string,
        public readonly data?: unknown,
    ) {
        super(message);
        this.name = 'RpcError';
    }
}

export interface JsonRpcTransportOptions {
    requestTimeoutMs?: number;
    autoReconnect?: boolean;
    reconnectInitialDelayMs?: number;
    reconnectMaxDelayMs?: number;
    maxQueueSize?: number;
}

const DEFAULT_OPTIONS: Required<JsonRpcTransportOptions> = {
    requestTimeoutMs: 15_000,
    autoReconnect: false,
    reconnectInitialDelayMs: 500,
    reconnectMaxDelayMs: 10_000,
    maxQueueSize: 1_000,
};

export class JsonRpcTransport {
    private ws: WebSocket | null = null;
    private nextId = 1;
    private readonly pending = new Map<number, PendingRequest>();
    private readonly notificationHandlers = new Map<string, Set<RpcNotificationHandler>>();
    private state: TransportState = 'disconnected';
    private onStateChange?: (state: TransportState) => void;
    private sendQueue: string[] = [];
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectAttempt = 0;
    private shouldReconnect = false;
    private readonly options: Required<JsonRpcTransportOptions>;

    constructor(
        private readonly url: string,
        options: JsonRpcTransportOptions = {},
    ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    connect(onStateChange?: (state: TransportState) => void): void {
        if (this.state === 'disposed') return;
        this.onStateChange = onStateChange;
        this.shouldReconnect = this.options.autoReconnect;
        if (this.state === 'connected' || this.state === 'connecting') return;
        this.doConnect();
    }

    disconnect(): void {
        if (this.state === 'disposed') return;
        this.shouldReconnect = false;
        this.clearReconnectTimer();
        this.ws?.close();
        this.ws = null;
        this.failSendQueue();
        this.rejectAllPending(new RpcError(RpcErrorCode.TransportDisconnected, 'Transport disconnected'));
        this.setState('disconnected');
    }

    request<T = unknown>(method: string, params?: unknown): Promise<T> {
        if (this.state === 'disposed') {
            return Promise.reject(new RpcError(RpcErrorCode.TransportDisposed, 'Transport disposed'));
        }

        const id = this.nextId++;
        const message: JsonRpcRequest = { jsonrpc: JSON_RPC_VERSION, id, method, params };

        return new Promise<T>((resolve, reject) => {
            const pending: PendingRequest = {
                resolve: resolve as (result: unknown) => void,
                reject,
            };

            if (this.options.requestTimeoutMs > 0) {
                pending.timeoutHandle = setTimeout(() => {
                    if (!this.pending.has(id)) return;
                    this.pending.delete(id);
                    reject(new RpcError(RpcErrorCode.RequestTimeout, `Request timeout: ${method}`));
                }, this.options.requestTimeoutMs);
            }

            this.pending.set(id, pending);

            try {
                this.enqueueOrSend(message);
            } catch (error) {
                this.pending.delete(id);
                if (pending.timeoutHandle) clearTimeout(pending.timeoutHandle);
                reject(
                    error instanceof RpcError
                        ? error
                        : new RpcError(RpcErrorCode.SendFailed, 'Failed to send request', error),
                );
            }
        });
    }

    notify(method: string, params?: unknown): void {
        if (this.state === 'disposed') return;
        const message: JsonRpcNotification = { jsonrpc: JSON_RPC_VERSION, method, params };
        this.enqueueOrSend(message);
    }

    onNotification(method: string, handler: RpcNotificationHandler): () => void {
        let handlers = this.notificationHandlers.get(method);
        if (!handlers) {
            handlers = new Set<RpcNotificationHandler>();
            this.notificationHandlers.set(method, handlers);
        }
        handlers.add(handler);

        return () => {
            const current = this.notificationHandlers.get(method);
            if (!current) return;
            current.delete(handler);
            if (current.size === 0) this.notificationHandlers.delete(method);
        };
    }

    getState(): TransportState {
        return this.state;
    }

    dispose(): void {
        if (this.state === 'disposed') return;

        this.shouldReconnect = false;
        this.clearReconnectTimer();
        this.failSendQueue();
        this.rejectAllPending(new RpcError(RpcErrorCode.TransportDisposed, 'Transport disposed'));
        this.notificationHandlers.clear();

        const ws = this.ws;
        this.ws = null;
        this.setState('disposed');
        ws?.close();
    }

    private doConnect(): void {
        if (this.state === 'disposed') return;

        this.clearReconnectTimer();
        this.setState('connecting');

        const ws = new WebSocket(this.url);
        this.ws = ws;

        ws.onopen = () => {
            if (this.ws !== ws || this.state === 'disposed') {
                ws.close();
                return;
            }

            this.reconnectAttempt = 0;
            this.setState('connected');

            if (this.sendQueue.length > 0) {
                for (const msg of this.sendQueue) ws.send(msg);
                this.sendQueue = [];
            }
        };

        ws.onmessage = (event: MessageEvent<string>) => {
            if (this.ws !== ws || this.state === 'disposed') return;
            this.handleMessage(event.data);
        };

        ws.onerror = () => {
            // Handled via onclose.
        };

        ws.onclose = () => {
            if (this.ws === ws) this.ws = null;
            if (this.state === 'disposed') return;

            this.setState('disconnected');
            this.failSendQueue();
            this.rejectAllPending(new RpcError(RpcErrorCode.TransportDisconnected, 'WebSocket closed'));

            if (this.shouldReconnect) {
                this.scheduleReconnect();
            }
        };
    }

    private scheduleReconnect(): void {
        if (this.state === 'disposed' || this.reconnectTimer) return;

        const delay = Math.min(
            this.options.reconnectInitialDelayMs * 2 ** this.reconnectAttempt,
            this.options.reconnectMaxDelayMs,
        );
        this.reconnectAttempt += 1;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.shouldReconnect && this.state !== 'disposed') {
                this.doConnect();
            }
        }, delay);
    }

    private handleMessage(raw: string): void {
        let msg: JsonRpcMessage;

        try {
            msg = JSON.parse(raw) as JsonRpcMessage;
        } catch {
            console.warn('[LSP Transport] Unparseable message:', raw);
            return;
        }

        if (!msg || typeof msg !== 'object' || (msg as { jsonrpc?: string }).jsonrpc !== JSON_RPC_VERSION) {
            console.warn('[LSP Transport] Invalid JSON-RPC message:', msg);
            return;
        }

        if ('id' in msg && msg.id !== undefined && !('method' in msg)) {
            this.handleResponse(msg);
            return;
        }

        if ('method' in msg && !('id' in msg)) {
            this.handleNotification(msg);
            return;
        }

        console.warn('[LSP Transport] Unsupported message shape:', msg);
    }

    private handleResponse(msg: JsonRpcResponse): void {
        const pending = this.pending.get(msg.id);
        if (!pending) {
            console.warn('[LSP Transport] Response without pending request, id:', msg.id);
            return;
        }

        this.pending.delete(msg.id);
        if (pending.timeoutHandle) clearTimeout(pending.timeoutHandle);

        if (msg.error) {
            pending.reject(new RpcError(msg.error.code, msg.error.message, msg.error.data));
            return;
        }

        pending.resolve(msg.result);
    }

    private handleNotification(msg: JsonRpcNotification): void {
        const handlers = this.notificationHandlers.get(msg.method);
        if (!handlers || handlers.size === 0) return;

        for (const handler of handlers) {
            try {
                handler(msg.method, msg.params);
            } catch (error) {
                console.error('[LSP Transport] Notification handler failed:', msg.method, error);
            }
        }
    }

    private enqueueOrSend(message: JsonRpcMessage): void {
        if (this.state === 'disposed') {
            throw new RpcError(RpcErrorCode.TransportDisposed, 'Transport disposed');
        }

        const raw = JSON.stringify(message);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(raw);
            return;
        }

        if (this.state !== 'connecting' && this.state !== 'connected') {
            throw new RpcError(RpcErrorCode.TransportDisconnected, 'Transport is not connected');
        }

        if (this.sendQueue.length >= this.options.maxQueueSize) {
            throw new RpcError(RpcErrorCode.SendQueueOverflow, 'Send queue overflow');
        }

        this.sendQueue.push(raw);
    }

    private rejectAllPending(error: RpcError): void {
        for (const [id, pending] of this.pending.entries()) {
            if (pending.timeoutHandle) clearTimeout(pending.timeoutHandle);
            pending.reject(error);
            this.pending.delete(id);
        }
    }

    private failSendQueue(): void {
        this.sendQueue = [];
    }

    private clearReconnectTimer(): void {
        if (!this.reconnectTimer) return;
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
    }

    private setState(state: TransportState): void {
        if (this.state === state) return;
        this.state = state;
        this.onStateChange?.(state);
    }
}
