export interface CircuitResponse {
    id: string;
    qubits: QubitResponse[];
}

export interface QubitResponse {
    name: string;
    gates: GateResponse[];
}

export interface GateResponse {
    id: string;
    type: 'PLACEHOLDER' | 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'CCX' | 'CZ' | 'SWAP' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'MEASURE';
}