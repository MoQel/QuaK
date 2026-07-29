import { describe, expect, it } from 'vitest';
import { decideEdit, PanelRegistry } from './arbitration.ts';

describe('decideEdit', () => {
    it('applies an edit based on the current version of an editable document', () => {
        expect(decideEdit({ documentVersion: 7, documentState: 'editable', baseVersion: 7 })).toEqual({
            kind: 'apply',
        });
    });

    it('rejects an edit whose base version has been overtaken', () => {
        expect(decideEdit({ documentVersion: 8, documentState: 'editable', baseVersion: 7 })).toEqual({
            kind: 'reject',
            reason: 'stale',
        });
    });

    it('rejects an edit from the future, which cannot be trusted either', () => {
        expect(decideEdit({ documentVersion: 7, documentState: 'editable', baseVersion: 9 })).toEqual({
            kind: 'reject',
            reason: 'stale',
        });
    });

    it('never writes to a read-only document', () => {
        expect(decideEdit({ documentVersion: 7, documentState: 'readOnly', baseVersion: 7 })).toEqual({
            kind: 'reject',
            reason: 'readOnly',
        });
    });

    it('reports a stale edit as stale even when the document is also read-only', () => {
        // Staleness is checked first, but either way the edit must not be written.
        expect(decideEdit({ documentVersion: 8, documentState: 'readOnly', baseVersion: 7 })).toEqual({
            kind: 'reject',
            reason: 'stale',
        });
    });

    it('writes to a document the user opted into editing', () => {
        // The one way past the read-only rule, and it takes a deliberate act:
        // the user was shown what would be lost and asked for it anyway.
        expect(decideEdit({ documentVersion: 7, documentState: 'editableByChoice', baseVersion: 7 })).toEqual({
            kind: 'apply',
        });
    });

    it('still refuses a stale edit on a document the user opted into', () => {
        // Consent to losing comments is not consent to overwriting someone else's change.
        expect(decideEdit({ documentVersion: 8, documentState: 'editableByChoice', baseVersion: 7 })).toEqual({
            kind: 'reject',
            reason: 'stale',
        });
    });
});

describe('PanelRegistry', () => {
    it('hands back every panel showing a document', () => {
        const registry = new PanelRegistry<string>();
        registry.add('a.qasm', 'panel-1');
        registry.add('a.qasm', 'panel-2');
        registry.add('b.qasm', 'panel-3');

        expect(registry.get('a.qasm')).toEqual(['panel-1', 'panel-2']);
        expect(registry.get('b.qasm')).toEqual(['panel-3']);
    });

    it('returns nothing for a document without panels', () => {
        expect(new PanelRegistry<string>().get('nobody.qasm')).toEqual([]);
    });

    it('keeps the remaining panels when one closes', () => {
        const registry = new PanelRegistry<string>();
        registry.add('a.qasm', 'panel-1');
        registry.add('a.qasm', 'panel-2');

        registry.remove('a.qasm', 'panel-1');

        expect(registry.get('a.qasm')).toEqual(['panel-2']);
    });

    it('forgets a document once its last panel closes', () => {
        const registry = new PanelRegistry<string>();
        registry.add('a.qasm', 'panel-1');

        registry.remove('a.qasm', 'panel-1');

        expect(registry.get('a.qasm')).toEqual([]);
        expect(registry.size).toBe(0);
    });

    it('ignores removing a panel that was never added', () => {
        const registry = new PanelRegistry<string>();
        registry.add('a.qasm', 'panel-1');

        registry.remove('a.qasm', 'ghost');
        registry.remove('unknown.qasm', 'panel-1');

        expect(registry.get('a.qasm')).toEqual(['panel-1']);
    });
});
