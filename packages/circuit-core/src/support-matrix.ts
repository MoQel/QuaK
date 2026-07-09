// OpenQASM 3 support matrix: which constructs the circuit editor can round-trip
// losslessly. Documents using an unsupported construct are shown read-only, so
// nothing is silently dropped.
//
// Early skeleton — the gate entries are provisional until the QASM transform and
// its fixtures actually prove the round trip.

export type SupportStatus = 'supported' | 'unsupported';

export interface SupportMatrixEntry {
    /** Gate identifier or OpenQASM construct slug. */
    construct: string;
    status: SupportStatus;
    /** Not yet proven by a round-trip fixture. */
    provisional?: boolean;
    /** Why unsupported, or how support is verified. */
    note?: string;
}

export const SUPPORT_MATRIX: readonly SupportMatrixEntry[] = [
    // Elementary gates the circuit editor renders today (round trip not yet proven).
    { construct: 'H', status: 'supported', provisional: true },
    { construct: 'X', status: 'supported', provisional: true },
    { construct: 'Y', status: 'supported', provisional: true },
    { construct: 'Z', status: 'supported', provisional: true },
    { construct: 'CX', status: 'supported', provisional: true },
    { construct: 'CCX', status: 'supported', provisional: true },
    { construct: 'CZ', status: 'supported', provisional: true },
    { construct: 'SWAP', status: 'supported', provisional: true },
    { construct: 'S', status: 'supported', provisional: true },
    { construct: 'T', status: 'supported', provisional: true },
    { construct: 'RX', status: 'supported', provisional: true },
    { construct: 'RY', status: 'supported', provisional: true },
    { construct: 'RZ', status: 'supported', provisional: true },

    // Constructs the circuit editor doesn't model — force read-only.
    { construct: 'if', status: 'unsupported', note: 'control flow' },
    { construct: 'for', status: 'unsupported', note: 'control flow' },
    { construct: 'while', status: 'unsupported', note: 'control flow' },
    { construct: 'def', status: 'unsupported', note: 'subroutine definitions' },
    { construct: 'comment', status: 'unsupported', note: 'user comments are content; regeneration would drop them' },
];

export const isConstructSupported = (construct: string): boolean =>
    SUPPORT_MATRIX.some((entry) => entry.construct === construct && entry.status === 'supported');
