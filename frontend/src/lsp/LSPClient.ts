/**
 * Layer 2: LSPClient
 *
 * Responsibilities:
 *  - LSP initialize handshake
 *  - Document synchronization
 *  - Monaco provider registration
 *  - Diagnostics handling
 */

import type * as monaco from 'monaco-editor';
import { JsonRpcTransport, RpcError, type TransportState } from './JsonRpcTransport';

interface LspPosition {
    line: number;
    character: number;
}

interface LspRange {
    start: LspPosition;
    end: LspPosition;
}

interface LspDiagnostic {
    range: LspRange;
    severity?: 1 | 2 | 3 | 4;
    code?: string | number;
    source?: string;
    message: string;
}

interface LspCompletionItem {
    label: string;
    kind?: number;
    detail?: string;
    documentation?: string | { kind: string; value: string };
    insertText?: string;
    insertTextFormat?: 1 | 2;
}

interface LspCompletionList {
    isIncomplete: boolean;
    items: LspCompletionItem[];
}

interface LspHover {
    contents: string | { kind: string; value: string } | Array<string | { language: string; value: string }>;
    range?: LspRange;
}

interface LspLocation {
    uri: string;
    range: LspRange;
}

export type LSPClientState = 'idle' | 'initializing' | 'ready' | 'error' | 'disposed';
type OpenDocuments = Map<string, number>;

export interface LSPClientOptions {
    languageId: string;
    wsUrl: string;
    rootUri?: string;
    requestTimeoutMs?: number;
}

export class LSPClient {
    private readonly transport: JsonRpcTransport;
    private state: LSPClientState = 'idle';
    private readonly openDocuments: OpenDocuments = new Map();
    private disposables: monaco.IDisposable[] = [];
    private readonly diagnosticsMap = new Map<string, monaco.editor.IMarkerData[]>();
    private readonly changeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
    private startPromise: Promise<void> | null = null;
    private initializePromise: Promise<void> | null = null;
    private providersRegistered = false;
    private disposed = false;

    constructor(
        private readonly options: LSPClientOptions,
        private readonly monacoInstance: typeof monaco,
    ) {
        this.transport = new JsonRpcTransport(options.wsUrl, {
            requestTimeoutMs: options.requestTimeoutMs ?? 15_000,
            autoReconnect: false,
        });
    }

    getState(): LSPClientState {
        return this.state;
    }

    async start(): Promise<void> {
        if (this.state === 'disposed') {
            throw new Error(`LSP client for "${this.options.languageId}" is disposed`);
        }

        if (this.startPromise) return this.startPromise;

        this.state = 'initializing';

        this.startPromise = new Promise<void>((resolve, reject) => {
            const onTransportStateChange = (transportState: TransportState) => {
                if (this.disposed) return;

                if (transportState === 'connected' && this.state === 'initializing' && !this.initializePromise) {
                    this.initializePromise = this.initialize();
                    this.initializePromise.then(resolve).catch(reject);
                    return;
                }

                if (transportState === 'disconnected' && this.state === 'initializing' && !this.initializePromise) {
                    this.state = 'error';
                    reject(new Error(`LSP transport disconnected before initialize: "${this.options.languageId}"`));
                }
            };

            this.transport.connect(onTransportStateChange);

            this.transport.onNotification('textDocument/publishDiagnostics', (_, params) => {
                if (this.disposed) return;
                this.handleDiagnostics(params as { uri: string; diagnostics: LspDiagnostic[] });
            });
        });

        return this.startPromise;
    }

    dispose(): void {
        if (this.disposed || this.state === 'disposed') return;

        this.disposed = true;
        this.state = 'disposed';

        for (const handle of this.changeTimeouts.values()) clearTimeout(handle);
        this.changeTimeouts.clear();

        if (this.transport.getState() === 'connected') {
            for (const uri of this.openDocuments.keys()) {
                this.transport.notify('textDocument/didClose', {
                    textDocument: { uri },
                });
            }
        }

        this.openDocuments.clear();

        for (const disposable of this.disposables) disposable.dispose();
        this.disposables = [];
        this.providersRegistered = false;

        for (const uri of Array.from(this.diagnosticsMap.keys())) {
            this.clearDiagnostics(uri);
        }

        this.transport.dispose();
    }

    didOpen(model: monaco.editor.ITextModel): void {
        if (this.disposed) return;

        const uri = model.uri.toString();
        if (this.openDocuments.has(uri)) return;

        this.openDocuments.set(uri, model.getVersionId());

        if (this.state === 'ready' && !model.isDisposed()) {
            this.sendDidOpen(model);
        }
    }

    didChange(model: monaco.editor.ITextModel): void {
        if (this.disposed) return;

        const uri = model.uri.toString();
        if (!this.openDocuments.has(uri)) {
            this.didOpen(model);
        }

        this.openDocuments.set(uri, model.getVersionId());

        const existing = this.changeTimeouts.get(uri);
        if (existing !== undefined) clearTimeout(existing);

        const handle = setTimeout(() => {
            this.changeTimeouts.delete(uri);

            if (this.disposed || this.state !== 'ready' || model.isDisposed() || !this.openDocuments.has(uri)) {
                return;
            }

            this.transport.notify('textDocument/didChange', {
                textDocument: { uri, version: model.getVersionId() },
                contentChanges: [{ text: model.getValue() }],
            });
        }, 300);

        this.changeTimeouts.set(uri, handle);
    }

    didClose(uri: string): void {
        if (this.disposed) return;
        if (!this.openDocuments.has(uri)) return;

        this.openDocuments.delete(uri);

        const handle = this.changeTimeouts.get(uri);
        if (handle !== undefined) {
            clearTimeout(handle);
            this.changeTimeouts.delete(uri);
        }

        if (this.state === 'ready') {
            this.transport.notify('textDocument/didClose', {
                textDocument: { uri },
            });
        }

        this.clearDiagnostics(uri);
    }

    private sendDidOpen(model: monaco.editor.ITextModel): void {
        if (this.disposed || model.isDisposed()) return;

        this.transport.notify('textDocument/didOpen', {
            textDocument: {
                uri: model.uri.toString(),
                languageId: this.options.languageId,
                version: model.getVersionId(),
                text: model.getValue(),
            },
        });
    }

    private async initialize(): Promise<void> {
        try {
            await this.transport.request('initialize', {
                processId: null,
                rootUri: this.options.rootUri ?? null,
                capabilities: {
                    textDocument: {
                        synchronization: {
                            dynamicRegistration: false,
                            willSave: false,
                            didSave: false,
                            willSaveWaitUntil: false,
                        },
                        completion: {
                            dynamicRegistration: false,
                            completionItem: {
                                snippetSupport: true,
                                documentationFormat: ['markdown', 'plaintext'],
                            },
                        },
                        hover: {
                            dynamicRegistration: false,
                            contentFormat: ['markdown', 'plaintext'],
                        },
                        definition: { dynamicRegistration: false },
                        publishDiagnostics: { relatedInformation: false },
                        codeAction: { dynamicRegistration: false },
                    },
                    workspace: {
                        applyEdit: false,
                        workspaceEdit: { documentChanges: false },
                    },
                },
                initializationOptions: {},
            });

            if (this.disposed) return;

            this.transport.notify('initialized', {});
            this.state = 'ready';

            this.registerMonacoProviders();
            this.replayOpenDocuments();

            console.info(`[LSP] Client ready for "${this.options.languageId}"`);
        } catch (error) {
            if (this.disposed) return;
            this.state = 'error';
            console.error(`[LSP] Initialize failed for "${this.options.languageId}":`, error);
            throw error;
        }
    }

    private replayOpenDocuments(): void {
        for (const uri of this.openDocuments.keys()) {
            const monacoUri = this.monacoInstance.Uri.parse(uri);
            const model = this.monacoInstance.editor.getModel(monacoUri);
            if (!model || model.isDisposed() || !this.openDocuments.has(uri)) continue;
            this.sendDidOpen(model);
        }
    }

    private registerMonacoProviders(): void {
        if (this.providersRegistered || this.disposed) return;

        const { languages } = this.monacoInstance;
        const langId = this.options.languageId;

        this.disposables.push(
            languages.registerCompletionItemProvider(langId, {
                triggerCharacters: ['.', ':', '"', "'", '/'],
                provideCompletionItems: (model, position) => this.provideCompletion(model, position),
            }),
            languages.registerHoverProvider(langId, {
                provideHover: (model, position) => this.provideHover(model, position),
            }),
            languages.registerDefinitionProvider(langId, {
                provideDefinition: (model, position) => this.provideDefinition(model, position),
            }),
        );

        this.providersRegistered = true;
        console.debug(`[LSP] Monaco providers registered for "${langId}"`);
    }

    private async provideCompletion(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
    ): Promise<monaco.languages.CompletionList | null> {
        if (this.state !== 'ready' || this.disposed || model.isDisposed()) return null;

        try {
            const response = await this.transport.request<LspCompletionList | LspCompletionItem[] | null>(
                'textDocument/completion',
                {
                    textDocument: { uri: model.uri.toString() },
                    position: toLspPosition(position),
                    context: { triggerKind: 1 },
                },
            );

            if (!response) return null;

            const items = Array.isArray(response) ? response : response.items;

            return {
                suggestions: items.map((item) => lspCompletionToMonaco(item, this.monacoInstance)),
            };
        } catch (error) {
            if (!(error instanceof RpcError)) console.error('[LSP] Completion error:', error);
            return null;
        }
    }

    private async provideHover(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
    ): Promise<monaco.languages.Hover | null> {
        if (this.state !== 'ready' || this.disposed || model.isDisposed()) return null;

        try {
            const response = await this.transport.request<LspHover | null>('textDocument/hover', {
                textDocument: { uri: model.uri.toString() },
                position: toLspPosition(position),
            });

            if (!response) return null;

            return {
                contents: lspMarkupToMonaco(response.contents),
                range: response.range ? lspRangeToMonaco(response.range) : undefined,
            };
        } catch (error) {
            if (!(error instanceof RpcError)) console.error('[LSP] Hover error:', error);
            return null;
        }
    }

    private async provideDefinition(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
    ): Promise<monaco.languages.Definition | null> {
        if (this.state !== 'ready' || this.disposed || model.isDisposed()) return null;

        try {
            const response = await this.transport.request<LspLocation | LspLocation[] | null>(
                'textDocument/definition',
                {
                    textDocument: { uri: model.uri.toString() },
                    position: toLspPosition(position),
                },
            );

            if (!response) return null;

            const locations = Array.isArray(response) ? response : [response];

            return locations.map((location) => ({
                uri: this.monacoInstance.Uri.parse(location.uri),
                range: lspRangeToMonaco(location.range),
            }));
        } catch (error) {
            if (!(error instanceof RpcError)) console.error('[LSP] Definition error:', error);
            return null;
        }
    }

    private handleDiagnostics(params: { uri: string; diagnostics: LspDiagnostic[] }): void {
        if (this.disposed) return;

        const { editor } = this.monacoInstance;
        const monacoUri = this.monacoInstance.Uri.parse(params.uri);
        const model = editor.getModel(monacoUri);
        if (!model || model.isDisposed()) return;

        const markers: monaco.editor.IMarkerData[] = params.diagnostics.map((diagnostic) => ({
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
            severity: lspSeverityToMonaco(diagnostic.severity, this.monacoInstance),
            message: diagnostic.message,
            code: diagnostic.code == null ? undefined : String(diagnostic.code),
            source: diagnostic.source,
        }));

        this.diagnosticsMap.set(params.uri, markers);
        editor.setModelMarkers(model, 'lsp', markers);
    }

    private clearDiagnostics(uri: string): void {
        const monacoUri = this.monacoInstance.Uri.parse(uri);
        const model = this.monacoInstance.editor.getModel(monacoUri);

        if (model && !model.isDisposed()) {
            this.monacoInstance.editor.setModelMarkers(model, 'lsp', []);
        }

        this.diagnosticsMap.delete(uri);
    }
}

function toLspPosition(position: monaco.Position): LspPosition {
    return {
        line: position.lineNumber - 1,
        character: position.column - 1,
    };
}

function lspRangeToMonaco(range: LspRange): monaco.IRange {
    return {
        startLineNumber: range.start.line + 1,
        startColumn: range.start.character + 1,
        endLineNumber: range.end.line + 1,
        endColumn: range.end.character + 1,
    };
}

function lspSeverityToMonaco(
    severity: LspDiagnostic['severity'],
    monacoInstance: typeof monaco,
): monaco.MarkerSeverity {
    const s = monacoInstance.MarkerSeverity;

    switch (severity) {
        case 1:
            return s.Error;
        case 2:
            return s.Warning;
        case 3:
            return s.Info;
        case 4:
            return s.Hint;
        default:
            return s.Error;
    }
}

function lspMarkupToMonaco(contents: LspHover['contents']): monaco.IMarkdownString[] {
    if (typeof contents === 'string') {
        return [{ value: contents }];
    }

    if (Array.isArray(contents)) {
        return contents.map((entry) =>
            typeof entry === 'string' ? { value: entry } : { value: `\`\`\`${entry.language}\n${entry.value}\n\`\`\`` },
        );
    }

    return [{ value: contents.value }];
}

function lspCompletionToMonaco(
    item: LspCompletionItem,
    monacoInstance: typeof monaco,
): monaco.languages.CompletionItem {
    const kind = lspCompletionKindToMonaco(item.kind, monacoInstance);

    const docValue = typeof item.documentation === 'string' ? item.documentation : item.documentation?.value;

    const documentation = docValue ? { value: docValue } : undefined;

    return {
        label: item.label,
        kind,
        detail: item.detail,
        documentation,
        insertText: item.insertText ?? item.label,
        insertTextRules:
            item.insertTextFormat === 2
                ? monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
        range: undefined as unknown as monaco.IRange,
    };
}

function lspCompletionKindToMonaco(
    kind: number | undefined,
    monacoInstance: typeof monaco,
): monaco.languages.CompletionItemKind {
    const k = monacoInstance.languages.CompletionItemKind;

    const map: Record<number, monaco.languages.CompletionItemKind> = {
        1: k.Text,
        2: k.Method,
        3: k.Function,
        4: k.Constructor,
        5: k.Field,
        6: k.Variable,
        7: k.Class,
        8: k.Interface,
        9: k.Module,
        10: k.Property,
        11: k.Unit,
        12: k.Value,
        13: k.Enum,
        14: k.Keyword,
        15: k.Snippet,
        16: k.Color,
        17: k.File,
        18: k.Reference,
        19: k.Folder,
        20: k.EnumMember,
        21: k.Constant,
        22: k.Struct,
        23: k.Event,
        24: k.Operator,
        25: k.TypeParameter,
    };

    return map[kind ?? 0] ?? k.Text;
}
