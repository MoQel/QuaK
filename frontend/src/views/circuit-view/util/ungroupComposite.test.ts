import { describe, expect, it } from 'vitest';
import {
    CircuitResponse,
    CompositeQuantumGateDto,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    isCompositeGate,
} from '@/api/dto/circuit.ts';
import { ungroupComposite } from './ungroupComposite.ts';

const qubit = (index: number): ElementSelectorDto => ({ registerId: 'r1', index });

const gate = (
    id: string,
    identifier: string,
    targets: number[],
    controls: number[] = [],
): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits: targets.map(qubit),
    controlQubits: controls.map(qubit),
    rotationAngle: 0,
});

/** `gate bell a, b { h a; cx a, b; }` called on q[0], q[1]. */
const bell = (overrides: Partial<CompositeQuantumGateDto> = {}): CompositeQuantumGateDto => ({
    id: 'composite',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [qubit(0), qubit(1)],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [gate('body-h', 'H', [0]), gate('body-cx', 'X', [1], [0])],
    ...overrides,
});

const layersOf = (...layers: CircuitResponse['layers'][number]['quantumOperations'][]): CircuitResponse['layers'] =>
    layers.map((quantumOperations) => ({ quantumOperations }));

const identifiersPerLayer = (layers: CircuitResponse['layers']): string[][] =>
    layers.map((layer) => layer.quantumOperations.map((op) => op.identifier as string));

describe('ungroupComposite', () => {
    it('replaces the box by its body, one operation per layer so program order survives', () => {
        const result = ungroupComposite(layersOf([bell()]), 'composite');

        expect(identifiersPerLayer(result)).toEqual([['H'], ['X']]);
    });

    /**
     * Both schedulers order the operations of one layer by their topmost qubit, so a body whose
     * first gate sits lower than its second would come out reversed if it were dropped into a
     * single layer.
     */
    it('keeps a body that acts bottom-up in its written order', () => {
        const result = ungroupComposite(
            layersOf([bell({ body: [gate('body-h', 'H', [1]), gate('body-cx', 'X', [1], [0])] })]),
            'composite',
        );

        expect(identifiersPerLayer(result)).toEqual([['H'], ['X']]);
        expect(result[0].quantumOperations[0].targetQubits).toEqual([qubit(1)]);
    });

    it('gives every freed operation a fresh identity', () => {
        const result = ungroupComposite(layersOf([bell()]), 'composite');

        const ids = result.flatMap((layer) => layer.quantumOperations.map((op) => op.id));
        expect(ids).toHaveLength(2);
        expect(new Set(ids).size).toBe(2);
        expect(ids).not.toContain('body-h');
        expect(ids).not.toContain('body-cx');
        expect(ids).not.toContain('composite');
    });

    it('leaves the rest of the box’s layer in place and keeps later layers behind the body', () => {
        const result = ungroupComposite(
            layersOf([bell(), gate('other', 'Y', [3])], [gate('later', 'Z', [0])]),
            'composite',
        );

        expect(identifiersPerLayer(result)).toEqual([['Y', 'H'], ['X'], ['Z']]);
    });

    /** Ungroup goes exactly one level: a gate the body calls stays a box of its own. */
    it('keeps a nested composite a composite', () => {
        const nested = bell({ id: 'nested', identifier: 'inner' });
        const outer = bell({ id: 'composite', identifier: 'outer', body: [gate('body-h', 'H', [0]), nested] });

        const result = ungroupComposite(layersOf([outer]), 'composite');

        const freed = result[1].quantumOperations[0];
        expect(isCompositeGate(freed)).toBe(true);
        expect(freed.identifier).toBe('inner');
        expect(isCompositeGate(freed) && freed.body.map((op) => op.identifier)).toEqual(['H', 'X']);
    });

    it('drops a gate with an empty body, and the layer with it', () => {
        const result = ungroupComposite(layersOf([bell({ body: [] })]), 'composite');

        expect(result).toEqual([]);
    });

    it('changes nothing for an unknown id or an operation that is not a composite', () => {
        const layers = layersOf([bell(), gate('plain', 'Y', [3])]);

        expect(ungroupComposite(layers, 'plain')).toBe(layers);
        expect(ungroupComposite(layers, 'nobody')).toBe(layers);
    });
});
