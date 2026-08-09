import { describe, expect, it } from 'vitest';
import {
    CircuitResponse,
    CompositeQuantumGateDto,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
} from '@/api/dto/circuit.ts';
import { collectCustomGates } from './customGates.ts';

const qubit = (index: number): ElementSelectorDto => ({ registerId: 'r1', index });

const gate = (
    identifier: string,
    targets: number[],
    controls: number[] = [],
    rotationAngle = 0,
): ElementaryQuantumGateDto => ({
    id: `elementary-${identifier}-${targets.join('')}`,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits: targets.map(qubit),
    controlQubits: controls.map(qubit),
    rotationAngle,
});

/** `gate bell a, b { h a; cx a, b; }` as called on the two given wires. */
const bell = (id: string, [a, b]: [number, number]): CompositeQuantumGateDto => ({
    id,
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [qubit(a), qubit(b)],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [gate('H', [a]), gate('X', [b], [a])],
});

/** `gate rot(theta) q { rx(theta) q; }` — one definition per argument value, all under one name. */
const rot = (id: string, wire: number, angle: number): CompositeQuantumGateDto => ({
    id,
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'rot',
    inverseForm: false,
    targetQubits: [qubit(wire)],
    controlQubits: [],
    portLabels: ['q'],
    usedQubitPositions: [0],
    body: [gate('RX', [wire], [], angle)],
});

const circuitOf = (...layers: CircuitResponse['layers'][number]['quantumOperations'][]): CircuitResponse => ({
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
    layers: layers.map((quantumOperations) => ({ quantumOperations })),
});

describe('collectCustomGates', () => {
    it('returns nothing without a circuit', () => {
        expect(collectCustomGates(undefined)).toEqual([]);
    });

    it('returns nothing for a circuit of built-in gates only', () => {
        expect(collectCustomGates(circuitOf([gate('H', [0])], [gate('X', [1], [0])]))).toEqual([]);
    });

    it('offers a called gate with its name and ports', () => {
        const collected = collectCustomGates(circuitOf([bell('call', [0, 1])]));

        expect(collected).toHaveLength(1);
        expect(collected[0].name).toBe('bell');
        expect(collected[0].label).toBe('bell');
        expect(collected[0].portLabels).toEqual(['a', 'b']);
        expect(collected[0].template.id).toBe('call');
    });

    it('collects a gate nested inside another gate', () => {
        const outer: CompositeQuantumGateDto = {
            id: 'outer',
            type: 'COMPOSITE_QUANTUM_GATE',
            identifier: 'pair',
            inverseForm: false,
            targetQubits: [qubit(0), qubit(1)],
            controlQubits: [],
            portLabels: ['x', 'y'],
            usedQubitPositions: [0, 1],
            body: [bell('inner', [0, 1])],
        };

        expect(collectCustomGates(circuitOf([outer])).map((entry) => entry.name)).toEqual(['pair', 'bell']);
    });

    it('offers one entry for the same gate called on different wires', () => {
        const collected = collectCustomGates(circuitOf([bell('first', [0, 1])], [bell('second', [2, 3])]));

        expect(collected).toHaveLength(1);
        // The first call is the one kept, so the list does not jump around while editing further down.
        expect(collected[0].template.id).toBe('first');
    });

    it('keeps variants of one gate name apart and labels them distinctly', () => {
        const collected = collectCustomGates(
            circuitOf([rot('quarter', 0, Math.PI / 4)], [rot('half', 1, Math.PI / 2)]),
        );

        expect(collected).toHaveLength(2);
        expect(collected.map((entry) => entry.name)).toEqual(['rot', 'rot']);
        expect(collected.map((entry) => entry.label)).toEqual(['rot', 'rot (2)']);
    });

    it('treats calls that only differ in wiring as one gate', () => {
        // `bell q[0], q[1]` and `bell q[3], q[2]`: same definition, bound the other way round.
        expect(collectCustomGates(circuitOf([bell('a', [0, 1])], [bell('b', [3, 2])]))).toHaveLength(1);
    });
});
