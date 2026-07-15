import type { HostMessage, WebviewMessage } from '../protocol.ts';

interface VsCodeApi {
    postMessage(message: WebviewMessage): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscodeApi = acquireVsCodeApi();

// For now the webview only mirrors the document text; the circuit editor replaces
// this once the sync is proven.
const root = document.getElementById('root');

window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
    // Only trust messages from our own frame. Compared against window.origin
    // rather than a fixed string, because the origin differs per environment:
    // "vscode-webview:" in desktop VSCode, "https:" when VSCode is web-hosted.
    if (event.origin !== window.origin) {
        return;
    }

    const message = event.data;
    if (message.type === 'documentChanged' && root) {
        root.textContent = message.text;
    }
});

vscodeApi.postMessage({ type: 'ready' });
