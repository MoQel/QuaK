// Pure helpers for edit arbitration and multi-panel tracking in the VSCode extension.
import type { DocumentClassification } from '@quak/qasm-transform';
import { isWritable, type DocumentState, type EditRejectedReason } from '../shared/protocol.ts';

export type EditDecision = { kind: 'apply' } | { kind: 'reject'; reason: EditRejectedReason };

/**
 * Turns the classification into what the user may do with the document.
 *
 * The opt-in is remembered per document, but the document keeps changing: a file
 * unlocked for its comments can grow an unsupported statement a minute later. The
 * user agreed to lose comments, nothing else.
 */
export function applyOptIn(input: { classification: DocumentClassification; hasOptedIn: boolean }): DocumentState {
    if (input.classification.kind === 'editable') {
        return 'editable';
    }

    if (input.classification.kind === 'commentsOnly' && input.hasOptedIn) {
        return 'editableByChoice';
    }

    return 'readOnly';
}

/** Decides whether a webview edit may be applied to the current document version. */
export function decideEdit(input: {
    documentVersion: number;
    documentState: DocumentState;
    baseVersion: number;
}): EditDecision {
    if (input.documentVersion !== input.baseVersion) {
        return { kind: 'reject', reason: 'stale' };
    }

    // Asking what may be written, rather than listing what may not: a state added
    // later is refused until someone says otherwise.
    if (!isWritable(input.documentState)) {
        return { kind: 'reject', reason: 'readOnly' };
    }

    return { kind: 'apply' };
}

/** Tracks all webview panels opened for each document URI. */
export class PanelRegistry<TPanel> {
    private readonly panelsByKey = new Map<string, Set<TPanel>>();

    public add(key: string, panel: TPanel): void {
        const panels = this.panelsByKey.get(key) ?? new Set<TPanel>();
        panels.add(panel);
        this.panelsByKey.set(key, panels);
    }

    public remove(key: string, panel: TPanel): void {
        const panels = this.panelsByKey.get(key);
        if (!panels) {
            return;
        }
        panels.delete(panel);
        if (panels.size === 0) {
            this.panelsByKey.delete(key);
        }
    }

    public get(key: string): readonly TPanel[] {
        return [...(this.panelsByKey.get(key) ?? [])];
    }

    public get size(): number {
        return this.panelsByKey.size;
    }
}
