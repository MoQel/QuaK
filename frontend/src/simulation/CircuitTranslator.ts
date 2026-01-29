import { CircuitResponse, RegisterResponse } from '@/api/dto/circuit.ts';
import * as qulacs from 'qulacs-wasm';
import { GateDefinitionIdentifier } from '@/api/dto/GateDefinitionIdentifier.ts';
import {
    Disposable,
    SimulationResult,
    StateVectorEntry,
    SimulationOptions,
    SimulationMode,
} from '@/simulation/simulation.types.ts';
import { Complex } from 'qulacs-wasm';

export class CircuitTranslator {
    // Default values, if options not set
    private static readonly SAMPLE_COUNT = 1024;
    private static readonly MAX_SIMULATION_QUBITS = 8;
    private static readonly DEFAULT_MODE: SimulationMode = 'exact';

    /**
     * Maps backend Circuit representation into qualacs simulation
     */
    static translateAndRun(circuitData: CircuitResponse, options: SimulationOptions = {}): SimulationResult {
        const maxQubits = options.maxQubits ?? this.MAX_SIMULATION_QUBITS;
        const sampleCount = options.sampleCount ?? this.SAMPLE_COUNT;
        const mode: SimulationMode = options.mode ?? this.DEFAULT_MODE;
        const consideredRegisters: RegisterResponse[] = this.filterRegisters(circuitData, maxQubits);

        // Not more than MAX_SIMULATION_QUBITS
        const consideredQubits = consideredRegisters.flatMap((reg) => reg.qubits);
        const numQubits = consideredQubits.length;

        // Early return if no circuit is present
        if (numQubits === 0) {
            return { stateVector: [], counts: null };
        }

        // Initialize Qulacs Circuit instances
        const state = new qulacs.QuantumState(numQubits);
        state.set_zero_state();
        const circuit = new qulacs.QuantumCircuit(numQubits);

        try {
            // Currently only full measurements supported measurement gates are ignored at the moment
            this.buildCircuit(consideredRegisters, circuit);

            // Calculate
            circuit.update_quantum_state(state);

            if (mode === 'simulation') {
                const rawResult = state.sampling(sampleCount);
                const counts = this.aggregateSamples(rawResult, numQubits);
                return { stateVector: [], counts: counts };
            } else if (mode === 'exact') {
                // Extract results
                const stateVector = this.extractStateVector(state, numQubits);

                return { stateVector, counts: null };
            } else return { stateVector: [], counts: null };
        } catch (error) {
            console.error('Simulation failed:', error);
            return { stateVector: [], counts: null };
        } finally {
            // Secure cast on our disposable interface for cleanup (type does not exist)
            (state as unknown as Disposable).delete();
            (circuit as unknown as Disposable).delete();
        }
    }

    /**
     * Filters the registers so that only those registers are considered
     * where the total number of qubits taken into account do not exceed maxQubits.
     * @param data CircuitResponse from circuit backend
     * @param maxQubits Maximum number of qubits.
     * @private
     */
    private static filterRegisters(data: CircuitResponse, maxQubits: number): RegisterResponse[] {
        let totalQubits = 0;
        const filteredRegisters: RegisterResponse[] = [];

        for (const reg of data.registers) {
            if (totalQubits + reg.qubits.length <= maxQubits) {
                filteredRegisters.push(reg);
                totalQubits += reg.qubits.length;
            } else {
                // Stop checking if adding this register exceeds the limit
                break;
            }
        }
        return filteredRegisters;
    }

    /**
     * Builds the circuit based on the filtered registers.
     */
    private static buildCircuit(registers: RegisterResponse[], circuit: qulacs.QuantumCircuit): void {
        const allQubits = registers.flatMap((reg) => reg.qubits);

        if (allQubits.length === 0) return;

        // Find max depth of circuit
        const maxSteps = Math.max(...allQubits.map((q) => q.gates.length));

        // Iterate column by column (Time Step by Time Step)
        for (let step = 0; step < maxSteps; step++) {
            let globalQubitIndex = 0;

            for (const register of registers) {
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
     *
     * Please be aware that although the qulacs python library is well maintained,
     * the last release of qulacs-wasm was a long time ago and there may be bugs in the gate mapping.
     * In such a case, define the gate using the custom addMatrixGate method,
     * which is a workaround for custom gates from their unitary matrix.
     */
    // #TODO: Add multiqubit support when backend supports it
    private static applyGate(
        circuit: qulacs.QuantumCircuit,
        type: GateDefinitionIdentifier,
        targetIdx: number,
        angle?: number,
    ) {
        // #TODO: Hard coded rotation angle change when backend support custom angle
        angle = Math.PI / 2;
        switch (type) {
            case 'H':
                circuit.add_H_gate(targetIdx);
                break;
            case 'X':
                circuit.add_X_gate(targetIdx);
                break;
            case 'Y':
                circuit.add_Y_gate(targetIdx);
                break;
            case 'Z':
                circuit.add_Z_gate(targetIdx);
                break;
            // Wrong mapping in Qulacs version 0.0.5
            case 'S':
                this.addMatrixGate(circuit, targetIdx, [
                    [1, 0],
                    [0, { real: 0, imag: 1 }],
                ]);
                break;
            case 'T':
                circuit.add_T_gate(targetIdx);
                break;
            // Inverted rotation direction in Qulacs version 0.0.5
            case 'RX':
                circuit.add_RX_gate(targetIdx, -(angle || 0));
                break;
            // Inverted rotation direction in Qulacs version 0.0.5
            case 'RY':
                circuit.add_RY_gate(targetIdx, -(angle || 0));
                break;
            // Inverted rotation direction in Qulacs version 0.0.5
            case 'RZ':
                circuit.add_RZ_gate(targetIdx, -(angle || 0));
                break;
            case 'MEASURE':
                break;
            default:
                console.warn(`Gate type ${type} not yet implemented in Translator`);
        }
    }

    /**
     * Extracts and formats the state vector.
     */
    private static extractStateVector(state: qulacs.QuantumState, numQubits: number): StateVectorEntry[] {
        // safe cast
        const vec = state.get_vector() as unknown as Complex[];

        return vec.map((complex, i) => {
            const { real, imag } = complex;

            // Probability = |alpha|^2
            const prob = real * real + imag * imag;

            // Qulacs Index 'i' is calculated as: sum(q_k * 2^k)
            // i.toString(2) produces MSB on the left (Big Endian standard)
            // Example: Qubit 0 = 1, Qubit 1 = 0 -> Index 1 -> "01" -> |q1 q0>
            const binaryString = i.toString(2).padStart(numQubits, '0');

            return {
                state: `|${binaryString}>`,
                real: real,
                imag: imag,
                prob: prob,
                // To avoid NaN at (0,0), we set phase to 0.
                phase: real === 0 && imag === 0 ? 0 : Math.atan2(imag, real),
            };
        });
    }

    /**
     * Converts raw integer samples from Qulacs into a count dictionary (histogram).
     */
    private static aggregateSamples(samples: number[], numQubits: number): Record<string, number> {
        const counts: Record<string, number> = {};

        for (const sample of samples) {
            // Convert int to binary string, padded to qubit count
            // e.g., 5 -> "101" (for 3 qubits)
            const bitString = sample.toString(2).padStart(numQubits, '0');

            counts[bitString] = (counts[bitString] || 0) + 1;
        }

        return counts;
    }

    private static addMatrixGate(
        circuit: qulacs.QuantumCircuit,
        target_index_list: number | number[],
        matrix: (Complex | number)[][],
    ) {
        const gate = qulacs.DenseMatrix(target_index_list, matrix);
        circuit.add_gate(gate);
    }
}
