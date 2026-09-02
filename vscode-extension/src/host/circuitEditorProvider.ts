// Host-side controller for the .qasm custom editor. It owns the VSCode document,
// creates webviews, broadcasts document snapshots, and applies approved edits.
import * as vscode from 'vscode';
import { toQasm, type DocumentClassification } from '@quak/qasm-transform';
import { applyOptIn, decideEdit, PanelRegistry } from './arbitration.ts';
import {
    isWebviewMessage,
    type ApplyEditMessage,
    type DocumentState,
    type EditRejectedReason,
    type HostMessage,
} from '../shared/protocol.ts';
import type { ClassificationCache } from './documentModel.ts';

export class CircuitEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'quak.circuitEditor';

    private readonly panels = new PanelRegistry<vscode.WebviewPanel>();
    // Opt-in to lossy editing, per document and only while it stays open.
    private readonly editingEnabled = new Set<string>();

    private constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly documents: ClassificationCache,
        private readonly onFailure: (error: unknown, context: string) => void,
    ) {}

    public static register(
        context: vscode.ExtensionContext,
        documents: ClassificationCache,
        onFailure: (error: unknown, context: string) => void,
    ): vscode.Disposable[] {
        const provider = new CircuitEditorProvider(context, documents, onFailure);

        return [
            vscode.window.registerCustomEditorProvider(CircuitEditorProvider.viewType, provider, {
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: true,
            }),
            vscode.workspace.onDidChangeTextDocument((event) => provider.broadcast(event.document)),
            // Closing the file ends the opt-in: the user agreed to lose the comments in
            // that document, once. Keeping it would silently skip the notice next time.
            vscode.workspace.onDidCloseTextDocument((document) =>
                provider.editingEnabled.delete(document.uri.toString()),
            ),
        ];
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
    ): Promise<void> {
        const key = document.uri.toString();
        this.panels.add(key, webviewPanel);

        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
        };
        webviewPanel.webview.html = this.buildHtml(webviewPanel.webview);

        const messageSub = webviewPanel.webview.onDidReceiveMessage((message: unknown) => {
            if (!isWebviewMessage(message)) {
                this.onFailure(
                    `Ignored a malformed webview message: ${describe(message)}`,
                    `Circuit editor for ${key}`,
                );
                return;
            }

            switch (message.type) {
                case 'ready':
                    this.post(webviewPanel, document);
                    break;
                case 'applyEdit':
                    // Nothing awaits this, so an unhandled rejection would be invisible.
                    void this.applyEdit(webviewPanel, document, message).catch((error: unknown) => {
                        this.onFailure(error, `Writing a circuit edit to ${key}`);
                        this.reject(webviewPanel, message.requestId, 'applyFailed', document.version);
                    });
                    break;
                case 'enableEditing':
                    this.editingEnabled.add(key);
                    this.broadcast(document);
                    break;
                case 'webviewError':
                    this.onFailure(message.stack ?? message.message, `Circuit editor for ${key}`);
                    break;
            }
        });

        webviewPanel.onDidDispose(() => {
            messageSub.dispose();
            this.panels.remove(key, webviewPanel);
        });
    }

    /** Applies a webview edit if it still matches the current document version. */
    private async applyEdit(
        panel: vscode.WebviewPanel,
        document: vscode.TextDocument,
        message: ApplyEditMessage,
    ): Promise<void> {
        const current = this.documents.of(document);
        if (!current) {
            // Nothing is known about the file, so nothing may be written over it.
            this.reject(panel, message.requestId, 'readOnly', document.version);
            return;
        }

        const decision = decideEdit({
            documentVersion: document.version,
            documentState: this.documentState(document, current.classification),
            baseVersion: message.baseVersion,
        });

        if (decision.kind === 'reject') {
            this.reject(panel, message.requestId, decision.reason, document.version);
            return;
        }

        const text = toQasm(message.content, current.preamble);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, wholeDocument(document), text);

        // WorkspaceEdit keeps the change in VSCode's undo history.
        if (!(await vscode.workspace.applyEdit(edit))) {
            this.reject(panel, message.requestId, 'applyFailed', document.version);
            return;
        }

        const applied: HostMessage = {
            type: 'editApplied',
            requestId: message.requestId,
            version: document.version,
        };
        void panel.webview.postMessage(applied);
    }

    private reject(
        panel: vscode.WebviewPanel,
        requestId: string,
        reason: EditRejectedReason,
        currentVersion: number,
    ): void {
        const rejected: HostMessage = { type: 'editRejected', requestId, reason, currentVersion };
        void panel.webview.postMessage(rejected);
    }

    private broadcast(document: vscode.TextDocument): void {
        const panels = this.panels.get(document.uri.toString());
        if (panels.length === 0) return;

        // Parse once and broadcast the same snapshot to all panels.
        const message = this.documentChanged(document);
        for (const panel of panels) {
            void panel.webview.postMessage(message);
        }
    }

    private documentState(document: vscode.TextDocument, classification: DocumentClassification): DocumentState {
        return applyOptIn({ classification, hasOptedIn: this.editingEnabled.has(document.uri.toString()) });
    }

    private documentChanged(document: vscode.TextDocument): HostMessage {
        const classified = this.documents.of(document);
        return {
            type: 'documentChanged',
            circuit: classified?.circuit ?? null,
            version: document.version,
            state: classified ? this.documentState(document, classified.classification) : 'failed',
            classification: classified?.classification ?? null,
        };
    }

    private post(panel: vscode.WebviewPanel, document: vscode.TextDocument): void {
        void panel.webview.postMessage(this.documentChanged(document));
    }

    private buildHtml(webview: vscode.Webview): string {
        const nonce = createNonce();
        const asset = (file: string) =>
            webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', file));
        const scriptUri = asset('webview.js');
        const styleUri = asset('webview.css');

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy"
                    content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QuaK Circuit Editor</title>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="app"></div>
                <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function wholeDocument(document: vscode.TextDocument): vscode.Range {
    return new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
}

function createNonce(): string {
    return crypto.randomUUID().replaceAll('-', '');
}

/** The message as far as it can be printed, so a protocol bug is diagnosable from the log. */
function describe(message: unknown): string {
    try {
        return JSON.stringify(message)?.slice(0, 200) ?? String(message);
    } catch {
        return String(message);
    }
}
