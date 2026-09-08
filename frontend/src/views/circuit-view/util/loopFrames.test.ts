import { describe, expect, it } from 'vitest';
import { ElementaryQuantumGateDto, LoopBlockDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { getLoopFrames } from './loopFrames.ts';

const registers: RegisterResponse[] = [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }];

const gate = (id: string, targets: number[], controls: number[] = []): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: 'H',
    inverseForm: false,
    targetQubits: targets.map((index) => ({ registerId: 'r1', index })),
    controlQubits: controls.map((index) => ({ registerId: 'r1', index })),
    rotationAngle: 0,
});

const columns = (...layers: ElementaryQuantumGateDto[][]) => layers.map((quantumOperations) => ({ quantumOperations }));

describe('getLoopFrames', () => {
    it('spans the bounding box of its members', () => {
        const layers = columns([gate('a', [1])], [gate('b', [2], [0])]);
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 3, operationIds: ['a', 'b'] }];

        expect(getLoopFrames(layers, blocks, registers)).toEqual([
            { id: 'loop', repeatCount: 3, firstColumn: 0, lastColumn: 1, topWire: 0, bottomWire: 2, depth: 0 },
        ]);
    });

    /** The rectangle is derived, so moving the members moves the frame with them. */
    it('follows its members when they are scheduled elsewhere', () => {
        const layers = columns([gate('outsider', [3])], [gate('a', [1])], [gate('b', [1])]);
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 2, operationIds: ['a', 'b'] }];

        const [frame] = getLoopFrames(layers, blocks, registers);
        expect(frame.firstColumn).toBe(1);
        expect(frame.lastColumn).toBe(2);
        expect(frame.topWire).toBe(1);
        expect(frame.bottomWire).toBe(1);
    });

    it('reports nesting depth so inner frames can be drawn inside outer ones', () => {
        const layers = columns([gate('a', [0])], [gate('b', [0])]);
        const blocks: LoopBlockDto[] = [
            { id: 'outer', repeatCount: 2, operationIds: ['a', 'b'] },
            { id: 'inner', repeatCount: 3, operationIds: ['b'] },
        ];

        const depths = Object.fromEntries(getLoopFrames(layers, blocks, registers).map((f) => [f.id, f.depth]));
        expect(depths).toEqual({ outer: 0, inner: 1 });
    });

    it('yields nothing for a frame whose members are gone', () => {
        const layers = columns([gate('a', [0])]);
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 2, operationIds: ['deleted'] }];

        expect(getLoopFrames(layers, blocks, registers)).toEqual([]);
    });
});
