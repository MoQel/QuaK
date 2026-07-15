import * as vscode from 'vscode';
import type { HostMessage, WebviewMessage } from './protocol.ts';

export class CircuitEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'quak.circuitEditor';

    // Every open panel per document URI. A document can be open in several panels (split view, "Open With…"), and all of them get every update.
    private readonly panelsByDocument = new Map<string, Set<vscode.WebviewPanel>>();

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
        const panels = this.panelsByDocument.get(key) ?? new Set<vscode.WebviewPanel>();
        panels.add(webviewPanel);
        this.panelsByDocument.set(key, panels);

        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
        };
        webviewPanel.webview.html = this.buildHtml(webviewPanel.webview);

        const messageSub = webviewPanel.webview.onDidReceiveMessage((message: WebviewMessage) => {
            // The webview asks for the current state once it has booted. PostMessage would be dropped until then.
            if (message.type === 'ready') {
                this.post(webviewPanel, document);
            }
        });

        webviewPanel.onDidDispose(() => {
            messageSub.dispose();
            const remaining = this.panelsByDocument.get(key);
            remaining?.delete(webviewPanel);
            if (remaining?.size === 0) {
                this.panelsByDocument.delete(key);
            }
        });
    }

    private broadcast(document: vscode.TextDocument): void {
        for (const panel of this.panelsByDocument.get(document.uri.toString()) ?? []) {
            this.post(panel, document);
        }
    }

    private post(panel: vscode.WebviewPanel, document: vscode.TextDocument): void {
        const message: HostMessage = {
            type: 'documentChanged',
            text: document.getText(),
            version: document.version,
        };
        void panel.webview.postMessage(message);
    }

    private buildHtml(webview: vscode.Webview): string {
        const nonce = createNonce();
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy"
                    content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QuaK Circuit Editor</title>
            </head>
            <body>
                <pre id="root"></pre>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

// The CSP nonce is what stops injected markup from running scripts in the webview.
function createNonce(): string {
    return crypto.randomUUID().replaceAll('-', '');
}
