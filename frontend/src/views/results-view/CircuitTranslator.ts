import {CircuitResponse, GateResponse, QubitResponse} from "@/api/dto/circuit";
import * as qulacs from "qulacs-wasm";
import {GateDefinitionIdentifier} from "@/api/dto/GateDefinitionIdentifier.ts";

/**
 * Defines the actual return value of the WASM library at runtime.
 * This corrects the often erroneous d.ts files of the library.
 */
interface QulacsComplex {
    real: number;
    imag: number;
}

/**
 * Emscripten objects have a delete method that is missing in the types.
 * This interface prevents the use of “any”.
 */
interface Disposable {
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

export class CircuitTranslator {

    private static readonly SAMPLE_COUNT = 1024;

    /**
     * Maps backend Circuit representation into qualacs simulation
     */
    static translateAndRun(circuitData: CircuitResponse): SimulationResult {
        const allQubits = circuitData.registers.flatMap(reg => reg.qubits);
        const numQubits = allQubits.length;

        // Early return if no circuit is present
        if (numQubits === 0) {
            return { stateVector: [], counts: null };
        }

        // Initialize Qulacs Circuit instances
        const state = new qulacs.QuantumState(numQubits);
        const circuit = new qulacs.QuantumCircuit(numQubits);

        try {
            this.buildCircuit(circuitData, circuit);
            // Calculate
            circuit.update_quantum_state(state);

            // Extract results
            const stateVector = this.extractStateVector(state, numQubits);
            const counts = this.performMeasurementIfNeeded(state, allQubits, numQubits);

            return { stateVector, counts };

        } catch (error) {
            console.error("Simulation failed:", error);
            return { stateVector: [], counts: null };
        } finally {
            // Secure cast on our disposable interface for cleanup (type does not exist)
            (state as unknown as Disposable).delete();
            (circuit as unknown as Disposable).delete();
        }
    }

    /**
     * Builds the circuit based on the backend data.
     */
    private static buildCircuit(data: CircuitResponse, circuit: qulacs.QuantumCircuit): void {
        const allQubits = data.registers.flatMap(reg => reg.qubits);
        // Find max depth of circuit
        const maxSteps = Math.max(...allQubits.map(q => q.gates.length));

        // Iterate column by column (Time Step by Time Step)
        for (let step = 0; step < maxSteps; step++) {
            let globalQubitIndex = 0;

            for (const register of data.registers) {
                for (const qubit of register.qubits) {
                    const gate = qubit.gates[step];

                    if (gate?.definitionId && gate.definitionId !== 'PLACEHOLDER') {
                        this.applyGate(circuit, gate.definitionId, globalQubitIndex);
                    }
                    globalQubitIndex++;
                }
            }
        }
    }

    /**
     * Applies a single gate to the circuit.
     * We do not support multi-qubit, rotation parameters and measurements yet!
     */
    private static applyGate(circuit: qulacs.QuantumCircuit, type: GateDefinitionIdentifier, targetIdx: number) {
        switch (type) {
            case 'H': circuit.add_H_gate(targetIdx); break;
            case 'X': circuit.add_X_gate(targetIdx); break;
            case 'Y': circuit.add_Y_gate(targetIdx); break;
            case 'Z': circuit.add_Z_gate(targetIdx); break;
            case 'S': circuit.add_S_gate(targetIdx); break;
            case 'T': circuit.add_T_gate(targetIdx); break;
            case 'RX': circuit.add_RX_gate(targetIdx, Math.PI / 2); break;
            case 'RY': circuit.add_RY_gate(targetIdx, Math.PI / 2); break;
            case 'RZ': circuit.add_RZ_gate(targetIdx, Math.PI / 2); break;
            case 'MEASURE': break;
            default:
                console.warn(`Gate type ${type} not yet implemented in Translator`);
        }
    }

    /**
     * Extracts and formats the state vector.
     */
    private static extractStateVector(state: qulacs.QuantumState, numQubits: number): StateVectorEntry[] {
        // safe cast
        const vec = state.get_vector() as unknown as QulacsComplex[];

        return vec.map((complex, i) => {
            const { real, imag } = complex;

            // Probability = |alpha|^2
            const prob = (real * real) + (imag * imag);

            return {
                // Qulacs is Little Endian, we need to convert to Big Endian
                state: `|${i.toString(2).padStart(numQubits, '0')}>`,
                real: real,
                imag: imag,
                prob: prob,
                // To avoid NaN at (0,0), we set phase to 0.
                phase: (real === 0 && imag === 0) ? 0 : Math.atan2(imag, real)
            };
        });
    }

    /**
     * Performs measurements if a MEASURE gate is present.
     */
    private static performMeasurementIfNeeded(
        state: qulacs.QuantumState,
        allQubits: QubitResponse[],
        numQubits: number
    ): Record<string, number> | null {

        const hasMeasure = allQubits.some(q => q.gates.some((g: GateResponse) => g.definitionId === 'MEASURE'));

        if (!hasMeasure) {
            return null;
        }

        const rawSamples = state.sampling(this.SAMPLE_COUNT);
        const counts: Record<string, number> = {};

        for (const sample of rawSamples) {
            const bin = sample.toString(2).padStart(numQubits, '0');
            counts[bin] = (counts[bin] || 0) + 1;
        }

        return counts;
    }
}