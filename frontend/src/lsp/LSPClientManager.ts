/**
 * Layer 3: LSPClientManager
 *
 * Responsibilities:
 *  - Singleton lifecycle
 *  - One LSP client per language
 *  - Lazy startup
 *  - Document routing
 */

import type * as monaco from 'monaco-editor';
import { LSPClient } from './LSPClient';

export interface LanguageServerConfig {
    languageId: string;
    wsUrl: string;
    rootUri?: string;
    requestTimeoutMs?: number;
}

class LSPClientManager {
    private readonly clients = new Map<string, LSPClient>();
    private monacoInstance: typeof monaco | null = null;
    private configs = new Map<string, LanguageServerConfig>();

    init(monacoInstance: typeof monaco, configs: LanguageServerConfig[]): void {
        this.monacoInstance = monacoInstance;

        const nextConfigs = new Map<string, LanguageServerConfig>();
        for (const config of configs) {
            nextConfigs.set(config.languageId, config);
        }

        for (const [languageId, client] of this.clients.entries()) {
            const next = nextConfigs.get(languageId);
            const prev = this.configs.get(languageId);

            const changed =
                !next ||
                next.wsUrl !== prev?.wsUrl ||
                next.rootUri !== prev.rootUri ||
                next.requestTimeoutMs !== prev.requestTimeoutMs;

            if (changed) {
                client.dispose();
                this.clients.delete(languageId);
            }
        }

        this.configs = nextConfigs;

        console.info(
            '[LSPManager] Initialized with languages:',
            configs.map((c) => c.languageId),
        );
    }

    onDocumentOpen(model: monaco.editor.ITextModel): void {
        const languageId = model.getLanguageId();
        const client = this.getOrStartClient(languageId);
        client?.didOpen(model);
    }

    onDocumentChange(model: monaco.editor.ITextModel): void {
        const client = this.clients.get(model.getLanguageId());
        client?.didChange(model);
    }

    onDocumentClose(model: monaco.editor.ITextModel): void {
        const client = this.clients.get(model.getLanguageId());
        client?.didClose(model.uri.toString());
    }

    private getOrStartClient(languageId: string): LSPClient | null {
        const existing = this.clients.get(languageId);
        if (existing) return existing;

        const config = this.configs.get(languageId);
        if (!config) return null;

        if (!this.monacoInstance) {
            console.warn('[LSPManager] Monaco not initialized yet');
            return null;
        }

        console.info(`[LSPManager] Starting LSP client for "${languageId}"`);

        const client = new LSPClient(
            {
                languageId: config.languageId,
                wsUrl: config.wsUrl,
                rootUri: config.rootUri,
                requestTimeoutMs: config.requestTimeoutMs,
            },
            this.monacoInstance,
        );

        this.clients.set(languageId, client);

        client.start().catch((error) => {
            console.error(`[LSPManager] Client start failed for "${languageId}":`, error);
            const current = this.clients.get(languageId);
            if (current === client) {
                client.dispose();
                this.clients.delete(languageId);
            }
        });

        return client;
    }
}

export const lspManager = new LSPClientManager();
