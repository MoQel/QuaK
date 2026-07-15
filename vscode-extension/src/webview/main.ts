import type { HostMessage, WebviewMessage } from '../protocol.ts';

interface VsCodeApi {
    postMessage(message: WebviewMessage): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscodeApi = acquireVsCodeApi();

// Placeholder until the circuit editor lands. It deliberately does not look like
// a text editor: mirroring the file alone is indistinguishable from VSCode's own
// editor, which makes it impossible to tell whether this view is live.
const status = document.getElementById('status');
const root = document.getElementById('root');

// The last state the host broadcast. Every edit we request is based on it, and the
// host refuses the edit if the document has moved on since.
let currentText = '';
let currentVersion = -1;

function setStatus(text: string): void {
    if (status) {
        status.textContent = text;
    }
}

function requestEdit(newText: string, baseVersion: number): void {
    const requestId = crypto.randomUUID();
    setStatus(`edit ${requestId.slice(0, 8)} sent (base version ${baseVersion})...`);
    vscodeApi.postMessage({ type: 'applyEdit', requestId, newText, baseVersion });
}

document.getElementById('edit')?.addEventListener('click', () => {
    requestEdit(`${currentText.trimEnd()}\nx q[0];\n`, currentVersion);
});

setStatus('waiting for the document...');

window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
    // Only trust messages from our own frame. Compared against globalThis.origin rather than a fixed string, because the origin differs
    // per environment: "vscode-webview:" in desktop VSCode, "https:" when VSCode is web-hosted.
    if (event.origin !== globalThis.origin) {
        setStatus(`ignored a message from an unexpected origin: ${event.origin}`);
        return;
    }

    const message = event.data;
    switch (message.type) {
        case 'documentChanged':
            currentText = message.text;
            currentVersion = message.version;
            setStatus(
                `version ${message.version} | ${message.text.length} chars | ${message.state} | updated ${new Date().toLocaleTimeString()}`,
            );
            if (root) {
                root.textContent = message.text;
            }
            break;

        case 'editApplied':
            setStatus(`edit ${message.requestId.slice(0, 8)} APPLIED -> version ${message.version}`);
            break;

        case 'editRejected':
            setStatus(
                `edit ${message.requestId.slice(0, 8)} REJECTED (${message.reason}) | document is at version ${message.currentVersion}`,
            );
            break;
    }
});

vscodeApi.postMessage({ type: 'ready' });
