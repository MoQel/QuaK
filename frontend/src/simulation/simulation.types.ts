/**
 * Emscripten objects have a delete method that is missing in the types.
 * This interface prevents the use of “any”.
 */
export interface Disposable {
    delete(): void;
}

/**
 * The result of our simulation for the UI.
 */
export interface SimulationResult {
    stateVector: StateVectorEntry[];
    counts: Record<string, number> | null;
}

export interface StateVectorEntry {
    state: string;
    real: number;
    imag: number;
    prob: number;
    phase: number;
}

export interface SimulationOptions {
    maxQubits?: number;
    sampleCount?: number;
    mode?: SimulationMode;
}

export type SimulationMode = 'exact' | 'simulation';
