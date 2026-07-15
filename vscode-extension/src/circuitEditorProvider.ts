import * as vscode from 'vscode';
import { decideEdit, PanelRegistry } from './arbitration.ts';
import type { ApplyEditMessage, DocumentState, EditRejectedReason, HostMessage, WebviewMessage } from './protocol.ts';

/**
 * Whether the circuit view may write back to this document.
 *
 * Placeholder: answering this properly needs the QASM transformation, so that we
 * only allow edits to documents that round-trip losslessly. Until then every
 * document counts as editable, and the webview only offers text-preserving
 * changes that append to the host's latest document snapshot.
 */
function classifyDocument(_document: vscode.TextDocument): DocumentState {
    return 'editable';
}

export class CircuitEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'quak.circuitEditor';

    private readonly panels = new PanelRegistry<vscode.WebviewPanel>();

    private constructor(private readonly context: vscode.ExtensionContext) {}

    public static register(context: vscode.ExtensionContext): vscode.Disposable[] {
        const provider = new CircuitEditorProvider(context);

        return [
            vscode.window.registerCustomEditorProvider(CircuitEditorProvider.viewType, provider, {
                // Cheap start. If memory turns out to matter revisit it, since the view is fully reconstructible from the file.
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: true,
            }),
            vscode.workspace.onDidChangeTextDocument((event) => provider.broadcast(event.document)),
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

        const messageSub = webviewPanel.webview.onDidReceiveMessage((message: WebviewMessage) => {
            switch (message.type) {
                // The webview asks for the current state once it has booted. PostMessage would be dropped until then.
                case 'ready':
                    this.post(webviewPanel, document);
                    break;
                case 'applyEdit':
                    void this.applyEdit(webviewPanel, document, message);
                    break;
            }
        });

        webviewPanel.onDidDispose(() => {
            messageSub.dispose();
            this.panels.remove(key, webviewPanel);
        });
    }

    /**
     * The single place where a webview may change the document.
     *
     * Rejecting is always safe, merging is not, so a stale edit is refused rather
     * than reconciled: the webview re-renders from the broadcast that follows and
     * the user repeats the action. At human speed those collisions are rare.
     */
    private async applyEdit(
        panel: vscode.WebviewPanel,
        document: vscode.TextDocument,
        message: ApplyEditMessage,
    ): Promise<void> {
        const decision = decideEdit({
            documentVersion: document.version,
            documentState: classifyDocument(document),
            baseVersion: message.baseVersion,
        });

        if (decision.kind === 'reject') {
            this.reject(panel, message.requestId, decision.reason, document.version);
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, wholeDocument(document), message.newText);

        // Going through WorkspaceEdit is what puts the change into VSCode's undo
        // history: ctrl+z in the text editor undoes an edit made in the webview.
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
        for (const panel of this.panels.get(document.uri.toString())) {
            this.post(panel, document);
        }
    }

    private post(panel: vscode.WebviewPanel, document: vscode.TextDocument): void {
        const message: HostMessage = {
            type: 'documentChanged',
            text: document.getText(),
            version: document.version,
            state: classifyDocument(document),
        };
        void panel.webview.postMessage(message);
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
                    content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QuaK Circuit Editor</title>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="app"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function wholeDocument(document: vscode.TextDocument): vscode.Range {
    return new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
}

// The CSP nonce is what stops injected markup from running scripts in the webview.
function createNonce(): string {
    return crypto.randomUUID().replaceAll('-', '');
}
