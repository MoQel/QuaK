import {GateDefinitionIdentifier} from '@/api/dto/GateDefinitionIdentifier.ts'

// --- Requests ---

export interface ChangeQubitNameRequest {
    id: string;
    name: string;
}

export interface AddGateRequest {
    definitionId: GateDefinitionIdentifier;
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
    gates: GateResponse[];
}

export interface GateResponse {
    id: string;
    definitionId: GateDefinitionIdentifier;
}