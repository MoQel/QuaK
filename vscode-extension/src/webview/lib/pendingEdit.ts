import type { CircuitResponse } from '@quak/circuit-core';

/** An edit shown to the user before the host has confirmed it. */
export interface PendingEdit {
    requestId: string;
    baseVersion: number;
    circuit: CircuitResponse;
}

/** Whether an optimistic edit is still shown: until the host sends a newer document, rejects it or confirms it. */
export const showsPendingEdit = (input: {
    pending: PendingEdit | undefined;
    documentVersion: number | undefined;
    rejectedRequestId: string | undefined;
    appliedRequestId?: string;
}): boolean =>
    input.pending !== undefined &&
    (input.documentVersion === undefined || input.documentVersion <= input.pending.baseVersion) &&
    input.rejectedRequestId !== input.pending.requestId &&
    input.appliedRequestId !== input.pending.requestId;
