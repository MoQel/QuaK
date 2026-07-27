import { beforeAll, describe, expect, it } from 'vitest';
import { initQulacs } from 'qulacs-wasm';
import { QulacsMapper } from './qulacsMapper.ts';
import type { CircuitResponse, CompositeQuantumGateDto, QuantumOperationDto } from '@/api/dto/circuit.ts';
import type { SimulationResult } from '@/simulation/simulation.types.ts';

const sel = (index: number) => ({ registerId: 'qreg-0', index });

const circuitOf = (numQubits: number, operations: QuantumOperationDto[]): CircuitResponse => ({
    id: 'test-circuit',
    registers: [{ id: 'qreg-0', name: 'q', type: 'Quantum_Register', numberOfQubits: numQubits }],
    layers: [{ quantumOperations: operations }],
});

const findState = (result: SimulationResult, stateStr: string) => {
    const state = result.stateVector.find((s) => s.state === stateStr);
    if (!state) throw new Error(`State ${stateStr} not found in state vector`);
    return state;
};

/** `gate bell a, b { h a; cx a, b; }` called on the given wires. */
const bellOn = (first: number, second: number): CompositeQuantumGateDto => ({
    id: 'composite-1',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [sel(first), sel(second)],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [
        {
            id: 'body-h',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'H',
            inverseForm: false,
            rotationAngle: 0,
            targetQubits: [sel(first)],
            controlQubits: [],
        },
        {
            id: 'body-cx',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'CX',
            inverseForm: false,
            rotationAngle: 0,
            targetQubits: [sel(second)],
            controlQubits: [sel(first)],
        },
    ],
});

describe('simulating user-defined gates', () => {
    beforeAll(async () => {
        await initQulacs();
    });

    /**
     * Regression: a composite used to be skipped, which silently simulated a circuit *without*
     * the gate — a wrong result rather than a visible failure.
     */
    it('applies the gates a composite is made of', () => {
        const result = QulacsMapper.translateAndRun(circuitOf(2, [bellOn(0, 1)]));

        expect(findState(result, '|00>').prob).toBeCloseTo(0.5);
        expect(findState(result, '|11>').prob).toBeCloseTo(0.5);
        expect(findState(result, '|01>').prob).toBeCloseTo(0);
        expect(findState(result, '|10>').prob).toBeCloseTo(0);
    });

    it('applies a composite on the wires it was called on', () => {
        // Same gate, but on wires 1 and 2 of a three-qubit circuit; wire 0 must stay |0>.
        // Note the ket order: qubit 0 is the *rightmost* character, so the entangled wires 1 and 2
        // are the two left ones and |110> is the "both flipped" branch.
        const result = QulacsMapper.translateAndRun(circuitOf(3, [bellOn(1, 2)]));

        expect(findState(result, '|000>').prob).toBeCloseTo(0.5);
        expect(findState(result, '|110>').prob).toBeCloseTo(0.5);
    });

    it('expands nested composites down to elementary gates', () => {
        const nested: CompositeQuantumGateDto = {
            ...bellOn(0, 1),
            id: 'composite-outer',
            identifier: 'outer',
            body: [bellOn(0, 1)],
        };

        const result = QulacsMapper.translateAndRun(circuitOf(2, [nested]));

        expect(findState(result, '|00>').prob).toBeCloseTo(0.5);
        expect(findState(result, '|11>').prob).toBeCloseTo(0.5);
    });

    it('treats a composite with an empty body as a no-op', () => {
        const result = QulacsMapper.translateAndRun(circuitOf(2, [{ ...bellOn(0, 1), body: [] }]));

        expect(findState(result, '|00>').prob).toBeCloseTo(1);
    });
});
