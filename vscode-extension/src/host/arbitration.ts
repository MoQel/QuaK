// Pure helpers for edit arbitration and multi-panel tracking in the VSCode extension.
import type { DocumentClassification } from '@quak/qasm-transform';
import { isWritable, type DocumentState, type EditRejectedReason } from '../shared/protocol.ts';

export type EditDecision = { kind: 'apply' } | { kind: 'reject'; reason: EditRejectedReason };

/** What the user may do with the document. The opt-in unlocks comments only, never a construct added later. */
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

    // Asks what may be written, so a state added later is refused by default.
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
