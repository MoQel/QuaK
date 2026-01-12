export type GateType = 'PLACEHOLDER' | 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'CCX' | 'CZ' | 'SWAP' | 'S' | 'T' | 'RX' | 'RY' | 'RZ' | 'MEASURE';

export interface CircuitResponse {
    id: string;
    registers: RegisterResponse[];
}

export interface RegisterResponse {
    id: string;
    name: string;
    qubits: QubitResponse[];
}

export interface QubitResponse {
    id: string;
    gates: GateResponse[];
}

export interface GateResponse {
    id: string;
    type: GateType;
}

export interface ChangeQubitNameRequest {
    id: string;
    name: string;
}

export interface AddGateRequest {
    type: GateType;
    toQubitIdx: number;
    toPositionIdx: number;
}

export interface MoveGateRequest {
    id: string;
    toQubitIdx: number;
    toPositionIdx: number;
}