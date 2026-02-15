import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    QuantumRegisterResponse,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import * as qulacs from 'qulacs-wasm';
import { Complex } from 'qulacs-wasm';
import {
    Disposable,
    SimulationMode,
    SimulationOptions,
    SimulationResult,
    StateVectorEntry,
} from '@/simulation/simulation.types.ts';

type RegisterOffsets = Record<string, number>;

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

        const numQubits = this.getTotalQubitCount(circuitData);

        // Early return if no circuit is present
        if (numQubits === 0) return this.createEmptyResult(numQubits);
        if (numQubits > maxQubits) {
            throw new Error(`Circuit exceeds maximum limit of ${maxQubits} qubits.`);
        }

        // Initialize offset Map
        const offsets = this.calculateRegisterOffsets(circuitData.registers);
        // Initialize Qulacs Circuit instances
        const state = new qulacs.QuantumState(numQubits);
        const circuit = new qulacs.QuantumCircuit(numQubits);

        try {
            // Build
            state.set_zero_state();
            this.buildCircuit(circuitData, circuit, offsets);

            // Calculate
            circuit.update_quantum_state(state);

            // Process
            return this.processResults(state, numQubits, mode, sampleCount);
        } catch (error) {
            console.error('Simulation failed:', error);
            return this.createEmptyResult(numQubits);
        } finally {
            // Secure cast on our disposable interface for cleanup (type does not exist)
            (state as unknown as Disposable).delete();
            (circuit as unknown as Disposable).delete();
        }
    }

    private static isQuantumRegister(reg: RegisterResponse): reg is QuantumRegisterResponse {
        return 'numberOfQubits' in reg;
    }

    private static getTotalQubitCount(circuitData: CircuitResponse): number {
        return circuitData.registers.reduce((sum, reg) => {
            return this.isQuantumRegister(reg) ? sum + reg.numberOfQubits : sum;
        }, 0);
    }

    private static calculateRegisterOffsets(registers: RegisterResponse[]): RegisterOffsets {
        const offsets: RegisterOffsets = {};
        let offsetCount = 0;

        for (const reg of registers) {
            if (this.isQuantumRegister(reg)) {
                offsets[reg.id] = offsetCount;
                offsetCount += reg.numberOfQubits;
            }
        }
        return offsets;
    }

    /**
     * Builds the circuit based on the filtered registers.
     */
    private static buildCircuit(
        circuitData: CircuitResponse,
        circuit: qulacs.QuantumCircuit,
        offsets: RegisterOffsets,
    ): void {
        const layers = circuitData.layers;
        // Iterate layer by layer (Time Step by Time Step)
        for (const layer of layers) {
            for (const op of layer.quantumOperations) {
                if (op.type !== 'ELEMENTARY_QUANTUM_GATE') continue;
                this.applyGate(circuit, op, offsets);
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
    private static applyGate(circuit: qulacs.QuantumCircuit, op: ElementaryQuantumGateDto, offsets: RegisterOffsets) {
        const type = op.operationDefinition;
        const angle = op.rotationAngle;
        // Resolve global indices
        const targets = op.targetQubits.map((t) => offsets[t.registerId] + t.index);
        const controls = op.controlQubits.map((t) => offsets[t.registerId] + t.index);

        switch (type) {
            case 'H':
                circuit.add_H_gate(targets[0]);
                break;
            case 'X':
                circuit.add_X_gate(targets[0]);
                break;
            case 'Y':
                circuit.add_Y_gate(targets[0]);
                break;
            case 'Z':
                circuit.add_Z_gate(targets[0]);
                break;
            case 'S':
                circuit.add_S_gate(targets[0]);
                break;
            case 'T':
                circuit.add_T_gate(targets[0]);
                break;
            case 'RX':
                circuit.add_RotX_gate(targets[0], angle);
                break;
            case 'RY':
                circuit.add_RotY_gate(targets[0], angle);
                break;
            case 'RZ':
                circuit.add_RotZ_gate(targets[0], angle);
                break;
            case 'CX':
                circuit.add_CNOT_gate(controls[0], targets[0]);
                break;
            case 'CZ':
                circuit.add_CZ_gate(controls[0], targets[0]);
                break;
            case 'SWAP':
                circuit.add_SWAP_gate(targets[0], targets[1]);
                break;
            case 'CCX':
                circuit.add_gate(qulacs.TOFFOLI(controls[0], controls[1], targets[0]));
                break;
            case 'MEASURE':
                break; // ignored
            default:
                console.warn(`Gate type ${type} not yet implemented in Translator`);
        }
    }

    private static processResults(
        state: qulacs.QuantumState,
        numQubits: number,
        mode: SimulationMode,
        sampleCount: number,
    ): SimulationResult {
        if (mode === 'simulation') {
            const rawResult = state.sampling(sampleCount);
            return {
                stateVector: [],
                counts: this.aggregateSamples(rawResult, numQubits),
                simulatedQubits: numQubits,
            };
        }

        if (mode === 'exact') {
            return {
                stateVector: this.extractStateVector(state, numQubits),
                counts: null,
                simulatedQubits: numQubits,
            };
        }

        return this.createEmptyResult(numQubits);
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

    private static createEmptyResult(numQubits: number): SimulationResult {
        return { stateVector: [], counts: null, simulatedQubits: numQubits };
    }
}
