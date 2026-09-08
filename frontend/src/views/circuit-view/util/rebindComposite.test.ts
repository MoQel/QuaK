import { describe, expect, it } from 'vitest';
import { rebindComposite } from './rebindComposite.ts';
import type { CompositeQuantumGateDto, ElementSelectorDto } from '@/api/dto/circuit.ts';

const sel = (index: number): ElementSelectorDto => ({ registerId: 'r1', index });
const indices = (selectors: ElementSelectorDto[]) => selectors.map((s) => s.index);

/** `gate bell a, b { h a; cx a, b; }` called on wires 0 and 1. */
const bellOn = (first: number, second: number): CompositeQuantumGateDto => ({
    id: 'op1',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [sel(first), sel(second)],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [
        {
            id: 'h',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'H',
            inverseForm: false,
            rotationAngle: 0,
            targetQubits: [sel(first)],
            controlQubits: [],
        },
        {
            id: 'cx',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'CX',
            inverseForm: false,
            rotationAngle: 0,
            targetQubits: [sel(second)],
            controlQubits: [sel(first)],
        },
    ],
});

describe('rebindComposite', () => {
    /**
     * The dangerous case: old and new wires overlap, so the backend still accepts the payload and
     * the gate silently comes to mean something else unless the body moves with the box.
     */
    it('moves the body along with the box when the ranges overlap', () => {
        const moved = rebindComposite(bellOn(0, 1), [sel(1), sel(2)]);

        expect(indices(moved.targetQubits)).toEqual([1, 2]);
        expect(indices(moved.body[0].targetQubits)).toEqual([1]);
        expect(indices(moved.body[1].targetQubits)).toEqual([2]);
        expect(indices(moved.body[1].controlQubits)).toEqual([1]);
    });

    it('moves the body to a disjoint range', () => {
        const moved = rebindComposite(bellOn(0, 1), [sel(5), sel(6)]);

        expect(indices(moved.body[0].targetQubits)).toEqual([5]);
        expect(indices(moved.body[1].controlQubits)).toEqual([5]);
    });

    /** Ports follow parameter order, so a body bound to the second port stays on the second wire. */
    it('keeps the port-to-wire assignment', () => {
        const moved = rebindComposite(bellOn(3, 1), [sel(0), sel(2)]);

        // parameter a: wire 3 -> 0, parameter b: wire 1 -> 2
        expect(indices(moved.body[0].targetQubits)).toEqual([0]);
        expect(indices(moved.body[1].targetQubits)).toEqual([2]);
        expect(indices(moved.body[1].controlQubits)).toEqual([0]);
    });

    it('rebinds a nested composite too', () => {
        const outer: CompositeQuantumGateDto = {
            ...bellOn(0, 1),
            identifier: 'outer',
            body: [bellOn(0, 1)],
        };

        const moved = rebindComposite(outer, [sel(2), sel(3)]);
        const nested = moved.body[0] as CompositeQuantumGateDto;

        expect(indices(nested.targetQubits)).toEqual([2, 3]);
        expect(indices(nested.body[0].targetQubits)).toEqual([2]);
    });

    it('leaves ports and identity untouched', () => {
        const moved = rebindComposite(bellOn(0, 1), [sel(2), sel(3)]);

        expect(moved.id).toBe('op1');
        expect(moved.identifier).toBe('bell');
        expect(moved.portLabels).toEqual(['a', 'b']);
    });
});
