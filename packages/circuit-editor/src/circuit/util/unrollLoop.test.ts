import { describe, expect, it } from 'vitest';
import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    LoopBlockDto,
    QuantumOperationDto,
    toExecutionOrder,
} from '@quak/circuit-core';
import { unrollLoop } from './unrollLoop.ts';

const qubit = (index: number): ElementSelectorDto => ({ registerId: 'r1', index });

const gate = (id: string, identifier: string, targets: number[]): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits: targets.map(qubit),
    controlQubits: [],
    rotationAngle: 0,
});

const circuitOf = (layers: QuantumOperationDto[][], loopBlocks: LoopBlockDto[] = []): CircuitResponse => ({
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
    layers: layers.map((quantumOperations) => ({ quantumOperations })),
    loopBlocks,
});

const identifiersPerLayer = (circuit: CircuitResponse): string[][] =>
    circuit.layers.map((layer) => layer.quantumOperations.map((op) => op.identifier as string));

const executedIdentifiers = (circuit: CircuitResponse): string[] =>
    toExecutionOrder(circuit).map((op) => op.identifier as string);

const allIds = (circuit: CircuitResponse): string[] =>
    circuit.layers.flatMap((layer) => layer.quantumOperations.map((op) => op.id!));

describe('unrollLoop', () => {
    it('repeats the body in place of the frame, keeping the body layered as it was', () => {
        const circuit = circuitOf(
            [[gate('h', 'H', [0]), gate('x', 'X', [1])], [gate('cx', 'X', [1])]],
            [{ id: 'loop', repeatCount: 3, operationIds: ['h', 'x', 'cx'] }],
        );

        const result = unrollLoop(circuit, 'loop');

        expect(identifiersPerLayer(result)).toEqual([['H', 'X'], ['X'], ['H', 'X'], ['X'], ['H', 'X'], ['X']]);
        expect(result.loopBlocks).toEqual([]);
    });

    it('leaves what the circuit computes unchanged', () => {
        const circuit = circuitOf(
            [[gate('h', 'H', [0])], [gate('x', 'X', [0])], [gate('z', 'Z', [1])]],
            [{ id: 'loop', repeatCount: 2, operationIds: ['h', 'x'] }],
        );

        expect(executedIdentifiers(unrollLoop(circuit, 'loop'))).toEqual(executedIdentifiers(circuit));
    });

    it('keeps the first pass and gives every copy a fresh id', () => {
        const circuit = circuitOf([[gate('h', 'H', [0])]], [{ id: 'loop', repeatCount: 3, operationIds: ['h'] }]);

        const ids = allIds(unrollLoop(circuit, 'loop'));

        expect(ids[0]).toBe('h');
        expect(new Set(ids).size).toBe(3);
    });

    it('splices the copies in before whatever followed the loop', () => {
        const circuit = circuitOf(
            [[gate('h', 'H', [0])], [gate('after', 'Z', [0])]],
            [{ id: 'loop', repeatCount: 2, operationIds: ['h'] }],
        );

        expect(identifiersPerLayer(unrollLoop(circuit, 'loop'))).toEqual([['H'], ['H'], ['Z']]);
    });

    it('gives every pass its own copy of a frame nested inside', () => {
        const circuit = circuitOf(
            [[gate('h', 'H', [0])], [gate('x', 'X', [0])]],
            [
                { id: 'outer', repeatCount: 2, operationIds: ['h', 'x'] },
                { id: 'inner', repeatCount: 3, operationIds: ['x'] },
            ],
        );

        const result = unrollLoop(circuit, 'outer');

        expect(result.loopBlocks).toHaveLength(2);
        expect(result.loopBlocks!.every((block) => block.repeatCount === 3)).toBe(true);
        expect(result.loopBlocks!.flatMap((block) => block.operationIds)).toHaveLength(2);
        expect(executedIdentifiers(result)).toEqual(executedIdentifiers(circuit));
    });

    it('hands the copies to an enclosing frame, so its count still applies to all of them', () => {
        const circuit = circuitOf(
            [[gate('h', 'H', [0])], [gate('x', 'X', [0])]],
            [
                { id: 'outer', repeatCount: 2, operationIds: ['h', 'x'] },
                { id: 'inner', repeatCount: 3, operationIds: ['x'] },
            ],
        );

        const result = unrollLoop(circuit, 'inner');

        expect(result.loopBlocks).toHaveLength(1);
        expect(result.loopBlocks![0].operationIds).toHaveLength(4);
        expect(result.loopBlocks![0].operationIds.slice(0, 2)).toEqual(['h', 'x']);
        expect(executedIdentifiers(result)).toEqual(executedIdentifiers(circuit));
    });

    it('multiplies out with a frame over exactly the same operations', () => {
        const circuit = circuitOf(
            [[gate('h', 'H', [0])]],
            [
                { id: 'twice', repeatCount: 2, operationIds: ['h'] },
                { id: 'thrice', repeatCount: 3, operationIds: ['h'] },
            ],
        );

        const result = unrollLoop(circuit, 'twice');

        expect(executedIdentifiers(result)).toHaveLength(6);
        expect(executedIdentifiers(circuit)).toHaveLength(6);
    });

    it('leaves a frame elsewhere in the circuit alone', () => {
        const circuit = circuitOf(
            [[gate('h', 'H', [0])], [gate('z', 'Z', [1])]],
            [
                { id: 'loop', repeatCount: 2, operationIds: ['h'] },
                { id: 'other', repeatCount: 4, operationIds: ['z'] },
            ],
        );

        expect(unrollLoop(circuit, 'loop').loopBlocks).toEqual([{ id: 'other', repeatCount: 4, operationIds: ['z'] }]);
    });

    it('leaves the circuit untouched for an unknown frame', () => {
        const circuit = circuitOf([[gate('h', 'H', [0])]], [{ id: 'loop', repeatCount: 2, operationIds: ['h'] }]);

        expect(unrollLoop(circuit, 'missing')).toBe(circuit);
    });
});
