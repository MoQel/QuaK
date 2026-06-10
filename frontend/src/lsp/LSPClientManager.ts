/**
 * Layer 3: LSPClientManager
 *
 * Responsibilities:
 *  - Singleton lifecycle
 *  - One LSP client per language
 *  - Lazy startup
 *  - Document routing
 *  - Debounced session close when a language is no longer visible
 */

import type * as monaco from 'monaco-editor';
import { LSPClient } from './LSPClient';

const HIDE_DELAY_MS = 5_000;
const RETRY_DELAY_MS = 5_000;

export interface LanguageServerConfig {
    languageId: string;
    wsUrl: string;
    rootUri?: string;
    requestTimeoutMs?: number;
}

interface ActiveDocument {
    uri: string;
    languageId: string;
}

class LSPClientManager {
    private readonly clients = new Map<string, LSPClient>();
    private monacoInstance: typeof monaco | null = null;
    private configs = new Map<string, LanguageServerConfig>();

    /**
     * groupId -> visible document. Tracking by group is important because the
     * same Monaco model can be visible in multiple editor groups.
     */
    private readonly activeDocuments = new Map<string, ActiveDocument>();
    private readonly hideTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private readonly retryNotBefore = new Map<string, number>();

    init(monacoInstance: typeof monaco, configs: LanguageServerConfig[]): void {
        this.monacoInstance = monacoInstance;

        const nextConfigs = new Map<string, LanguageServerConfig>();
        for (const config of configs) {
            nextConfigs.set(config.languageId, config);
        }

        for (const [languageId, client] of this.clients.entries()) {
            const next = nextConfigs.get(languageId);
            const prev = this.configs.get(languageId);
            const changed = this.hasConfigChanged(prev, next);

            if (changed) {
                this.cancelHideTimer(languageId);
                this.retryNotBefore.delete(languageId);
                client.dispose();
                this.clients.delete(languageId);
            }
        }

        for (const languageId of this.hideTimers.keys()) {
            if (this.hasConfigChanged(this.configs.get(languageId), nextConfigs.get(languageId))) {
                this.cancelHideTimer(languageId);
            }
        }

        for (const languageId of this.retryNotBefore.keys()) {
            if (this.hasConfigChanged(this.configs.get(languageId), nextConfigs.get(languageId))) {
                this.retryNotBefore.delete(languageId);
            }
        }

        this.configs = nextConfigs;
    }

    disposeAll(): void {
        for (const timer of this.hideTimers.values()) clearTimeout(timer);
        this.hideTimers.clear();

        for (const client of this.clients.values()) client.dispose();
        this.clients.clear();

        this.activeDocuments.clear();
        this.retryNotBefore.clear();
    }

    /**
     * Called when a document becomes the active model in an editor group.
     * Cancels any pending hide timer for the language and ensures the LSP
     * session is running.
     */
    onDocumentOpen(groupId: string, model: monaco.editor.ITextModel): void {
        const languageId = model.getLanguageId();
        const uri = model.uri.toString();
        const previous = this.activeDocuments.get(groupId);

        if (previous?.uri === uri && previous.languageId === languageId) {
            this.cancelHideTimer(languageId);
            this.getOrStartClient(languageId)?.didOpen(model);
            return;
        }

        if (previous) {
            this.hideDocument(groupId, previous);
        }

        const wasAlreadyVisible = this.visibleCountForDocument(uri, languageId) > 0;
        this.activeDocuments.set(groupId, { uri, languageId });
        this.cancelHideTimer(languageId);
        const client = this.getOrStartClient(languageId);
        if (!wasAlreadyVisible) client?.didOpen(model);
    }

    /**
     * Called when a document is replaced as the active model in an editor
     * group (tab switch), but the tab itself is still open.  Schedules a
     * deferred close of the LSP session if no other group is still showing
     * a document for the same language.
     */
    onDocumentHide(groupId: string, model: monaco.editor.ITextModel): void {
        const active = this.activeDocuments.get(groupId);
        if (active?.uri !== model.uri.toString()) return;
        this.hideDocument(groupId, active);
    }

    onDocumentActivity(groupId: string, model: monaco.editor.ITextModel): void {
        const active = this.activeDocuments.get(groupId);
        if (!this.isActiveDocument(active, model)) return;

        this.cancelHideTimer(active.languageId);
        this.getOrStartClient(active.languageId)?.didOpen(model);
    }

    onDocumentChange(groupId: string, model: monaco.editor.ITextModel): void {
        const active = this.activeDocuments.get(groupId);
        if (!this.isActiveDocument(active, model)) return;

        this.cancelHideTimer(active.languageId);
        const client = this.getOrStartClient(active.languageId);
        client?.didChange(model);
    }

    /**
     * Called when a tab is actually closed (model disposed).
     * Removes the model from active tracking and forwards didClose to the client.
     */
    onDocumentClose(model: monaco.editor.ITextModel): void {
        const uri = model.uri.toString();
        const affectedLanguages = new Set<string>([model.getLanguageId()]);

        for (const [groupId, active] of this.activeDocuments.entries()) {
            if (active.uri === uri) {
                affectedLanguages.add(active.languageId);
                this.activeDocuments.delete(groupId);
            }
        }

        for (const languageId of affectedLanguages) {
            this.clients.get(languageId)?.didClose(uri);
            if (this.visibleCountForLanguage(languageId) === 0) {
                this.scheduleHide(languageId);
            }
        }
    }

    private visibleCountForLanguage(languageId: string): number {
        let count = 0;
        for (const active of this.activeDocuments.values()) {
            if (active.languageId === languageId) count++;
        }
        return count;
    }

    private hasConfigChanged(
        previous: LanguageServerConfig | undefined,
        next: LanguageServerConfig | undefined,
    ): boolean {
        return (
            !next ||
            next.wsUrl !== previous?.wsUrl ||
            next.rootUri !== previous?.rootUri ||
            next.requestTimeoutMs !== previous?.requestTimeoutMs
        );
    }

    private isActiveDocument(
        active: ActiveDocument | undefined,
        model: monaco.editor.ITextModel,
    ): active is ActiveDocument {
        return (
            active?.uri === model.uri.toString() && active.languageId === model.getLanguageId() && !model.isDisposed()
        );
    }

    private visibleCountForDocument(uri: string, languageId: string): number {
        let count = 0;
        for (const active of this.activeDocuments.values()) {
            if (active.uri === uri && active.languageId === languageId) count++;
        }
        return count;
    }

    private hideDocument(groupId: string, document: ActiveDocument): void {
        this.activeDocuments.delete(groupId);

        if (this.visibleCountForDocument(document.uri, document.languageId) === 0) {
            this.clients.get(document.languageId)?.didClose(document.uri);
        }

        if (this.visibleCountForLanguage(document.languageId) === 0) {
            this.scheduleHide(document.languageId);
        }
    }

    private scheduleHide(languageId: string): void {
        if (this.hideTimers.has(languageId)) return; // already scheduled

        const timer = setTimeout(() => {
            this.hideTimers.delete(languageId);
            // Re-check: a new document may have been opened in the meantime
            if (this.visibleCountForLanguage(languageId) > 0) return;

            const client = this.clients.get(languageId);
            if (client) {
                client.dispose();
                this.clients.delete(languageId);
            }
        }, HIDE_DELAY_MS);

        this.hideTimers.set(languageId, timer);
    }

    private cancelHideTimer(languageId: string): void {
        const timer = this.hideTimers.get(languageId);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.hideTimers.delete(languageId);
        }
    }

    private getOrStartClient(languageId: string): LSPClient | null {
        const existing = this.clients.get(languageId);
        if (existing) {
            if (existing.getState() === 'error') {
                existing.dispose();
                this.clients.delete(languageId);
            } else {
                return existing;
            }
        }

        const retryAt = this.retryNotBefore.get(languageId);
        if (retryAt !== undefined && Date.now() < retryAt) return null;

        const config = this.configs.get(languageId);
        if (!config) return null;

        if (!this.monacoInstance) return null;

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

        client
            .start()
            .then(() => {
                if (this.clients.get(languageId) === client) {
                    this.retryNotBefore.delete(languageId);
                }
            })
            .catch((error) => {
                console.error(`[LSPManager] Client start failed for "${languageId}":`, error);
                const current = this.clients.get(languageId);
                if (current === client) {
                    client.dispose();
                    this.clients.delete(languageId);
                    this.retryNotBefore.set(languageId, Date.now() + RETRY_DELAY_MS);
                }
            });

        return client;
    }
}

export const lspManager = new LSPClientManager();
