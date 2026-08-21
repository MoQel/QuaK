import { QulacsMapper } from '@/simulation/qulacsMapper.ts';
import { initQulacs } from 'qulacs-wasm';
import { WorkerRequest, WorkerResponse } from './messages.ts';

// TypeScript needs to know this is a Worker context
const ctx = globalThis as unknown as DedicatedWorkerGlobalScope;

let isInitialized: boolean = false;
let initPromise: Promise<void> | null = null;

const ensureInitialized = async () => {
    if (isInitialized) return;

    // Simple mutex pattern to prevent double init
    initPromise ??= initQulacs().then(() => {
        isInitialized = true;
    });
    await initPromise;
};

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
    const msg = event.data;

    try {
        if (msg.type === 'CALCULATE_CIRCUIT') {
            await ensureInitialized();

            const result = QulacsMapper.translateAndRun(msg.circuit, msg.options);

            ctx.postMessage({
                type: 'SUCCESS',
                requestId: msg.requestId,
                payload: result,
            } satisfies WorkerResponse);
        }
    } catch (error) {
        ctx.postMessage({
            type: 'ERROR',
            requestId: msg.requestId,
            error: error instanceof Error ? error.message : 'Unknown Worker Error',
        } satisfies WorkerResponse);
    }
};
