import {GateType} from '@/api/dto/GateType.ts'

// --- Requests ---

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

// --- Responses ---

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
    gates: CircuitGateResponse[];
}

export interface CircuitGateResponse {
    id: string;
    type: GateType;
}