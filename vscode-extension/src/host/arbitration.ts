// Pure helpers for edit arbitration and multi-panel tracking in the VSCode extension.
import type { DocumentState, EditRejectedReason } from '../shared/protocol.ts';

export type EditDecision = { kind: 'apply' } | { kind: 'reject'; reason: EditRejectedReason };

/** Decides whether a webview edit may be applied to the current document version. */
export function decideEdit(input: {
    documentVersion: number;
    documentState: DocumentState;
    baseVersion: number;
}): EditDecision {
    if (input.documentVersion !== input.baseVersion) {
        return { kind: 'reject', reason: 'stale' };
    }

    if (input.documentState === 'readOnly') {
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
