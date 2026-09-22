import { describe, expect, it } from 'vitest';
import {
    CircuitResponse,
    CompositeQuantumGateDto,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    isCompositeGate,
    LoopBlockDto,
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

const circuitOf = (
    layers: CircuitResponse['layers'][number]['quantumOperations'][],
    loopBlocks: LoopBlockDto[] = [],
): CircuitResponse => ({
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
    layers: layers.map((quantumOperations) => ({ quantumOperations })),
    loopBlocks,
});

const identifiersPerLayer = (circuit: CircuitResponse): string[][] =>
    circuit.layers.map((layer) => layer.quantumOperations.map((op) => op.identifier as string));

describe('ungroupComposite', () => {
    it('replaces the box by its body, one operation per layer so program order survives', () => {
        const result = ungroupComposite(circuitOf([[bell()]]), 'composite');

        expect(identifiersPerLayer(result)).toEqual([['H'], ['X']]);
    });

    /**
     * A frame holds ids, so dissolving the gate it covered would leave it pointing at nothing and
     * the loop would silently disappear along with the box.
     */
    it('hands the box’s place in a frame to the operations that replaced it', () => {
        const circuit = circuitOf([[bell()]], [{ id: 'loop', repeatCount: 3, operationIds: ['composite'] }]);

        const result = ungroupComposite(circuit, 'composite');

        const freedIds = result.layers.flatMap((layer) => layer.quantumOperations.map((op) => op.id!));
        expect(result.loopBlocks).toEqual([{ id: 'loop', repeatCount: 3, operationIds: freedIds }]);
    });

    it('keeps the freed operations in program order inside the frame', () => {
        const circuit = circuitOf(
            [[gate('before', 'Y', [3]), bell()]],
            [{ id: 'loop', repeatCount: 2, operationIds: ['before', 'composite'] }],
        );

        const result = ungroupComposite(circuit, 'composite');

        // 'before' keeps its slot, the two freed gates take the box's place behind it.
        expect(result.loopBlocks![0].operationIds).toHaveLength(3);
        expect(result.loopBlocks![0].operationIds[0]).toBe('before');
    });

    it('leaves frames that did not cover the box alone', () => {
        const circuit = circuitOf(
            [[bell(), gate('other', 'Y', [3])]],
            [{ id: 'loop', repeatCount: 2, operationIds: ['other'] }],
        );

        expect(ungroupComposite(circuit, 'composite').loopBlocks).toEqual([
            { id: 'loop', repeatCount: 2, operationIds: ['other'] },
        ]);
    });

    /**
     * Both schedulers order the operations of one layer by their topmost qubit, so a body whose
     * first gate sits lower than its second would come out reversed if it were dropped into a
     * single layer.
     */
    it('keeps a body that acts bottom-up in its written order', () => {
        const result = ungroupComposite(
            circuitOf([[bell({ body: [gate('body-h', 'H', [1]), gate('body-cx', 'X', [1], [0])] })]]),
            'composite',
        );

        expect(identifiersPerLayer(result)).toEqual([['H'], ['X']]);
        expect(result.layers[0].quantumOperations[0].targetQubits).toEqual([qubit(1)]);
    });

    it('gives every freed operation a fresh identity', () => {
        const result = ungroupComposite(circuitOf([[bell()]]), 'composite');

        const ids = result.layers.flatMap((layer) => layer.quantumOperations.map((op) => op.id));
        expect(ids).toHaveLength(2);
        expect(new Set(ids).size).toBe(2);
        expect(ids).not.toContain('body-h');
        expect(ids).not.toContain('body-cx');
        expect(ids).not.toContain('composite');
    });

    it('leaves the rest of the box’s layer in place and keeps later layers behind the body', () => {
        const result = ungroupComposite(
            circuitOf([[bell(), gate('other', 'Y', [3])], [gate('later', 'Z', [0])]]),
            'composite',
        );

        expect(identifiersPerLayer(result)).toEqual([['Y', 'H'], ['X'], ['Z']]);
    });

    /** Ungroup goes exactly one level: a gate the body calls stays a box of its own. */
    it('keeps a nested composite a composite', () => {
        const nested = bell({ id: 'nested', identifier: 'inner' });
        const outer = bell({ id: 'composite', identifier: 'outer', body: [gate('body-h', 'H', [0]), nested] });

        const result = ungroupComposite(circuitOf([[outer]]), 'composite');

        const freed = result.layers[1].quantumOperations[0];
        expect(isCompositeGate(freed)).toBe(true);
        expect(freed.identifier).toBe('inner');
        expect(isCompositeGate(freed) && freed.body.map((op) => op.identifier)).toEqual(['H', 'X']);
    });

    it('drops a gate with an empty body, and the layer with it', () => {
        const result = ungroupComposite(circuitOf([[bell({ body: [] })]]), 'composite');

        expect(result.layers).toEqual([]);
    });

    it('changes nothing for an unknown id or an operation that is not a composite', () => {
        const circuit = circuitOf([[bell(), gate('plain', 'Y', [3])]]);

        expect(ungroupComposite(circuit, 'plain')).toBe(circuit);
        expect(ungroupComposite(circuit, 'nobody')).toBe(circuit);
    });
});
