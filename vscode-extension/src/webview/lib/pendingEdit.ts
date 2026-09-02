import type { CircuitResponse } from '@quak/circuit-core';

/** An edit shown to the user before the host has confirmed it. */
export interface PendingEdit {
    requestId: string;
    baseVersion: number;
    circuit: CircuitResponse;
}

/**
 * Returns whether an optimistic circuit edit should still be shown: until the host
 * broadcasts a newer document, rejects the edit, or confirms it without a document
 * change (the written QASM was byte-identical, so no newer version ever arrives).
 */
export const showsPendingEdit = (input: {
    pending: PendingEdit | undefined;
    documentVersion: number | undefined;
    rejectedRequestId: string | undefined;
    appliedRequestId?: string | undefined;
}): boolean =>
    input.pending !== undefined &&
    (input.documentVersion === undefined || input.documentVersion <= input.pending.baseVersion) &&
    input.rejectedRequestId !== input.pending.requestId &&
    input.appliedRequestId !== input.pending.requestId;
