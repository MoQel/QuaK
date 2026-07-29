import { describe, expect, it } from 'vitest';
import type { CircuitResponse } from '@quak/circuit-core';
import { showsPendingEdit, type PendingEdit } from './pendingEdit.ts';

const circuit: CircuitResponse = { id: 'document', registers: [], layers: [] };
const pending: PendingEdit = { requestId: 'req-1', baseVersion: 7, circuit };

describe('an optimistic edit is shown only while the host has not answered', () => {
    it('shows nothing when no edit is in flight', () => {
        expect(showsPendingEdit({ pending: undefined, documentVersion: 7, rejectedRequestId: undefined })).toBe(false);
    });

    it('shows the edit while no newer document version has arrived', () => {
        expect(showsPendingEdit({ pending, documentVersion: 7, rejectedRequestId: undefined })).toBe(true);
    });

    it('stops once a newer document snapshot arrives', () => {
        expect(showsPendingEdit({ pending, documentVersion: 8, rejectedRequestId: undefined })).toBe(false);
    });

    // A rejected edit may never arrive as a newer document snapshot.
    it('stops when the host rejects the edit, even though the text never arrives', () => {
        expect(showsPendingEdit({ pending, documentVersion: 7, rejectedRequestId: 'req-1' })).toBe(false);
    });

    it('keeps showing the edit when some other request was the one rejected', () => {
        expect(showsPendingEdit({ pending, documentVersion: 7, rejectedRequestId: 'req-0' })).toBe(true);
    });
});
