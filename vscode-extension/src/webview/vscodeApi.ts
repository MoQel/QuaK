import type { WebviewMessage } from '../shared/protocol.ts';

// View-local state persisted by VSCode across webview reloads.
export interface WebviewState {
    libraryCollapsed?: boolean;
}

interface VsCodeApi {
    postMessage(message: WebviewMessage): void;
    getState(): WebviewState | undefined;
    setState(state: WebviewState): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// acquireVsCodeApi may only be called once per webview.
export const vscodeApi = acquireVsCodeApi();
