import type { WebviewMessage } from '../protocol.ts';

// Small, view-local UI state that VSCode persists for us across webview reloads
// (and keeps in memory while the panel is hidden). Not the document — that stays
// the host's authority; this is only ephemeral view preference.
export interface WebviewState {
    libraryCollapsed?: boolean;
}

interface VsCodeApi {
    postMessage(message: WebviewMessage): void;
    getState(): WebviewState | undefined;
    setState(state: WebviewState): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// Must be called exactly once per webview; calling it twice throws. Everything
// that needs to talk to the host or persist view state shares this one handle.
export const vscodeApi = acquireVsCodeApi();
