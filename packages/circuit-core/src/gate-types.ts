// Shared gate/operation type identifiers. Presentation (icons, colors, shapes)
// lives in the editor layer, not here.

export type OperationIdentifier =
    | 'H'
    | 'X'
    | 'Y'
    | 'Z'
    | 'CX'
    | 'CCX'
    | 'CZ'
    | 'SWAP'
    | 'S'
    | 'T'
    | 'RX'
    | 'RY'
    | 'RZ'
    | 'MEASURE'
    | 'DUMMY';

export type QuantumOperationType = 'ELEMENTARY_QUANTUM_GATE' | 'MEASUREMENT' | 'DUMMY';
