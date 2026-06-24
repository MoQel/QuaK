import { CircuitResponse, ElementaryQuantumGateDto, getCircuitWidth } from '@/api/dto/circuit.ts';
import * as qulacs from 'qulacs-wasm';
import { Complex } from 'qulacs-wasm';
import {
    Disposable,
    SimulationMode,
    SimulationOptions,
    SimulationResult,
    StateVectorEntry,
} from '@/simulation/simulation.types.ts';
import { buildWireIndex, WireIndex } from '@/lib/circuitIndex.ts';

type GateType = ElementaryQuantumGateDto['identifier'];

type GateContext = {
    circuit: qulacs.QuantumCircuit;

    targets: number[];

    controls: number[];

    angle: number;
};

export class CircuitTranslator {
    // Default values, if options not set
    private static readonly SAMPLE_COUNT = 1024;
    private static readonly MAX_CIRCUIT_WIDTH = 12;
    private static readonly DEFAULT_MODE: SimulationMode = 'exact';

    /**
     * Maps backend Circuit representation into qualacs simulation
     */
    static translateAndRun(circuitData: CircuitResponse, options: SimulationOptions = {}): SimulationResult {
        const maxCircuitWidth = options.maxCircuitWidth ?? this.MAX_CIRCUIT_WIDTH;
        const sampleCount = options.sampleCount ?? this.SAMPLE_COUNT;
        const mode: SimulationMode = options.mode ?? this.DEFAULT_MODE;

        const circuitWidth = getCircuitWidth(circuitData);

        // Early return if no circuit is present
        if (circuitWidth === 0) return this.createEmptyResult(circuitWidth);
        if (circuitWidth > maxCircuitWidth) {
            throw new Error(`Circuit exceeds maximum limit of ${maxCircuitWidth} qubits.`);
        }

        const wireIndex = buildWireIndex(circuitData.registers, 'quantum');
        // Initialize Qulacs Circuit instances
        const state = new qulacs.QuantumState(circuitWidth);
        const circuit = new qulacs.QuantumCircuit(circuitWidth);

        try {
            // Build
            state.set_zero_state();
            this.buildCircuit(circuitData, circuit, wireIndex);

            // Calculate
            circuit.update_quantum_state(state);

            // Process
            return this.processResults(state, circuitWidth, mode, sampleCount);
        } catch (error) {
            console.error('Simulation failed:', error);
            return this.createEmptyResult(circuitWidth);
        } finally {
            // Secure cast on our disposable interface for cleanup (type does not exist)
            (state as unknown as Disposable).delete();
            (circuit as unknown as Disposable).delete();
        }
    }

    /**
     * Builds the circuit based on the filtered registers.
     */
    private static buildCircuit(
        circuitData: CircuitResponse,
        circuit: qulacs.QuantumCircuit,
        wireIndex: WireIndex,
    ): void {
        const layers = circuitData.layers;
        // Iterate layer by layer (Time Step by Time Step)
        for (const layer of layers) {
            for (const op of layer.quantumOperations) {
                if (op.type !== 'ELEMENTARY_QUANTUM_GATE') continue;
                this.applyGate(circuit, op, wireIndex);
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
    private static applyGate(circuit: qulacs.QuantumCircuit, op: ElementaryQuantumGateDto, wireIndex: WireIndex) {
        const type = op.identifier;
        const angle = op.rotationAngle;
        // Resolve global indices
        const targets = op.targetQubits
            .map((target) => wireIndex.getWireIndex(target))
            .filter((target): target is number => target !== undefined);
        const controls = op.controlQubits
            .map((control) => wireIndex.getWireIndex(control))
            .filter((control): control is number => control !== undefined);

        const handler = this.qulacsGateAdapters[type];

        if (!handler) {
            console.warn(`Gate type ${type} not yet implemented in Translator`);

            return;
        }

        handler({ circuit, targets, controls, angle });
    }

    // Mapping instead of switch case to reduce complexity for sonar linter
    private static readonly qulacsGateAdapters: Partial<Record<GateType, (ctx: GateContext) => void>> = {
        H: ({ circuit, targets }) => {
            if (hasIndices(targets, 1)) circuit.add_H_gate(targets[0]);
        },
        X: ({ circuit, targets }) => {
            if (hasIndices(targets, 1)) circuit.add_X_gate(targets[0]);
        },
        Y: ({ circuit, targets }) => {
            if (hasIndices(targets, 1)) circuit.add_Y_gate(targets[0]);
        },
        Z: ({ circuit, targets }) => {
            if (hasIndices(targets, 1)) circuit.add_Z_gate(targets[0]);
        },
        S: ({ circuit, targets }) => {
            if (hasIndices(targets, 1)) circuit.add_S_gate(targets[0]);
        },
        T: ({ circuit, targets }) => {
            if (hasIndices(targets, 1)) circuit.add_T_gate(targets[0]);
        },
        RX: ({ circuit, targets, angle }) => {
            if (hasIndices(targets, 1)) circuit.add_RotX_gate(targets[0], angle);
        },
        RY: ({ circuit, targets, angle }) => {
            if (hasIndices(targets, 1)) circuit.add_RotY_gate(targets[0], angle);
        },
        RZ: ({ circuit, targets, angle }) => {
            if (hasIndices(targets, 1)) circuit.add_RotZ_gate(targets[0], angle);
        },
        CX: ({ circuit, controls, targets }) => {
            if (hasIndices(controls, 1) && hasIndices(targets, 1)) {
                circuit.add_CNOT_gate(controls[0], targets[0]);
            }
        },
        CZ: ({ circuit, controls, targets }) => {
            if (hasIndices(controls, 1) && hasIndices(targets, 1)) {
                circuit.add_CZ_gate(controls[0], targets[0]);
            }
        },
        SWAP: ({ circuit, targets }) => {
            if (hasIndices(targets, 2)) {
                circuit.add_SWAP_gate(targets[0], targets[1]);
            }
        },
        CCX: ({ circuit, controls, targets }) => {
            if (hasIndices(controls, 2) && hasIndices(targets, 1)) {
                circuit.add_gate(qulacs.TOFFOLI(controls[0], controls[1], targets[0]));
            }
        },
        MEASURE: () => undefined,
    };

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
            // toString(2) provides the binary representation where the LSB (Qubit 0)
            // is the rightmost character. This is equivalent to Little Endian representation |q_(n-1)...q_0>.
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

function hasIndices(indices: number[], requiredCount: number): boolean {
    return indices.length >= requiredCount;
}
