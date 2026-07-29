import type { DocumentState, EditRejectedReason } from './protocol.ts';

export type EditDecision = { kind: 'apply' } | { kind: 'reject'; reason: EditRejectedReason };

/**
 * Decides whether a webview may write its text to the document.
 *
 * Kept free of the vscode API so the rule itself can be tested directly: a
 * webview's messages cannot be observed from an integration test, so this is the
 * only place where the behaviour is actually verifiable.
 */
export function decideEdit(input: {
    documentVersion: number;
    documentState: DocumentState;
    baseVersion: number;
}): EditDecision {
    // Someone changed the document since the webview last saw it; the edit was
    // computed from text that no longer exists. Rejecting is always safe, merging
    // is not, so the webview rebases on the next broadcast and the user retries.
    if (input.documentVersion !== input.baseVersion) {
        return { kind: 'reject', reason: 'stale' };
    }

    // A document that cannot be regenerated losslessly must never be written back
    // to, or a visual edit would silently drop content. Unless the user was told
    // exactly what would be lost and asked for it anyway — that is what
    // 'editableByChoice' records, and it is the only way past this.
    if (input.documentState === 'readOnly') {
        return { kind: 'reject', reason: 'readOnly' };
    }

    return { kind: 'apply' };
}

/**
 * Tracks which panels show which document, so a change reaches all of them.
 * Multi-panel is the normal case (split view, "Open With..."), not an edge case.
 */
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
