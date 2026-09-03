import { beforeAll, describe, expect, it } from 'vitest';
import { initQulacs } from 'qulacs-wasm';
import { QulacsMapper } from './qulacsMapper.ts';
import type { CircuitResponse, ElementaryQuantumGateDto, LoopBlockDto } from '@/api/dto/circuit.ts';
import type { SimulationResult } from '@/simulation/simulation.types.ts';

const sel = (index: number) => ({ registerId: 'qreg-0', index });

const gate = (id: string, identifier: string, target: number): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    rotationAngle: 0,
    targetQubits: [sel(target)],
    controlQubits: [],
});

const circuitOf = (layers: ElementaryQuantumGateDto[][], loopBlocks: LoopBlockDto[] = []): CircuitResponse => ({
    id: 'test-circuit',
    registers: [{ id: 'qreg-0', name: 'q', type: 'Quantum_Register', numberOfQubits: 1 }],
    layers: layers.map((quantumOperations) => ({ quantumOperations })),
    loopBlocks,
});

const probabilityOf = (result: SimulationResult, state: string) =>
    result.stateVector.find((entry) => entry.state === state)?.prob ?? 0;

/**
 * A repetition frame means its body runs *n* times. Ignoring it would simulate a different circuit
 * than the editor draws, and nothing in the UI would show that anything is wrong — which makes these
 * the tests that matter most for loops.
 */
describe('QulacsMapper with repetition frames', () => {
    beforeAll(async () => {
        await initQulacs();
    });

    it('runs a framed body as often as the frame says', () => {
        // X three times on |0> ends at |1>; running it once would give the same answer, so use ×2
        // (back to |0>) against an unframed single X (|1>) to tell the two apart.
        const repeatedTwice = QulacsMapper.translateAndRun(
            circuitOf([[gate('a', 'X', 0)]], [{ id: 'loop', repeatCount: 2, operationIds: ['a'] }]),
        );

        expect(probabilityOf(repeatedTwice, '|0>')).toBeCloseTo(1);
        expect(probabilityOf(repeatedTwice, '|1>')).toBeCloseTo(0);
    });

    it('runs an odd repeat count an odd number of times', () => {
        const repeatedThrice = QulacsMapper.translateAndRun(
            circuitOf([[gate('a', 'X', 0)]], [{ id: 'loop', repeatCount: 3, operationIds: ['a'] }]),
        );

        expect(probabilityOf(repeatedThrice, '|1>')).toBeCloseTo(1);
    });

    it('multiplies nested frames', () => {
        // Inner ×3 inside outer ×2 = 6 applications of X, i.e. back to |0>.
        const nested = QulacsMapper.translateAndRun(
            circuitOf(
                [[gate('a', 'X', 0)]],
                [
                    { id: 'inner', repeatCount: 3, operationIds: ['a'] },
                    { id: 'outer', repeatCount: 2, operationIds: ['a'] },
                ],
            ),
        );

        expect(probabilityOf(nested, '|0>')).toBeCloseTo(1);
    });

    it('leaves an unframed circuit alone', () => {
        const single = QulacsMapper.translateAndRun(circuitOf([[gate('a', 'X', 0)]]));

        expect(probabilityOf(single, '|1>')).toBeCloseTo(1);
    });
});
