import type { ElementSelectorDto } from '@/api/dto/circuit.ts';

export interface Disposable {
    delete(): void;
}

export interface SimulationResult {
    status: SimulationStatus;
    stateVector: StateVectorEntry[];
    counts: Record<string, number> | null;
    measurementResults: MeasurementResult[];
    simulatedQubits: number;
    shots?: number;
    measuredShotCount?: number;
    distinctOutcomeCount?: number;
    readoutRegisters?: ReadoutRegisterInfo[];
    outcomes?: SimulationOutcome[];
    measurementMappings?: MeasurementMapping[];
    error?: SimulationError;
}

export interface ReadoutRegisterInfo {
    registerId: string;
    name: string;
    size: number;
}

export type SimulationStatus = 'COMPLETED';

export interface SimulationOutcome {
    combinedKey: string;
    registerValues: Record<string, string>;
    count: number;
    probability: number;
    percentage: number;
}

export interface MeasurementMapping {
    operationId?: string;
    executionOrder: number;
    source: {
        registerId: string;
        registerName: string;
        bitIndex: number;
        globalQubitIndex: number;
    };
    target: {
        registerId: string;
        registerName: string;
        bitIndex: number;
        classicalAddress: number;
    };
}

export interface SimulationError {
    code: string;
    message: string;
    operationId?: string;
    registerId?: string;
    registerName?: string;
    bitIndex?: number;
    details?: Record<string, unknown>;
}

export interface MeasurementResult {
    operationId?: string;
    targetQubit: ElementSelectorDto;
    classicBit?: ElementSelectorDto;
    outcome: 0 | 1;
    probabilities: {
        zero: number;
        one: number;
    };
    counts?: {
        zero: number;
        one: number;
    };
}

export interface StateVectorEntry {
    state: string;
    real: number;
    imag: number;
    prob: number;
    phase: number;
}

export interface SimulationOptions {
    maxCircuitWidth?: number;
    sampleCount?: number;
    mode?: SimulationMode;
    measurementMode?: MeasurementMode;
}

export type SimulationMode = 'exact' | 'simulation';
export type MeasurementMode = 'measurement-gates' | 'measurement-gates-plus-final';
