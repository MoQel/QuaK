import { describe, expect, it } from 'vitest';
import { CompositeQuantumGateDto, ElementaryQuantumGateDto, ElementSelectorDto } from '@/api/dto/circuit.ts';
import { buildCompositePreview, MAX_PREVIEW_COLUMNS } from './compositePreview.ts';

const qubit = (index: number, registerId = 'r1'): ElementSelectorDto => ({ registerId, index });

const gate = (
    id: string,
    identifier: string,
    targets: ElementSelectorDto[],
    controls: ElementSelectorDto[] = [],
): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits: targets,
    controlQubits: controls,
    rotationAngle: 0,
});

/** `gate bell a, b { h a; cx a, b; }` — called here on q[2], q[3], so the binding is not the identity. */
const bell = (overrides: Partial<CompositeQuantumGateDto> = {}): CompositeQuantumGateDto => ({
    id: 'composite',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [qubit(2), qubit(3)],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [gate('body-h', 'H', [qubit(2)]), gate('body-cx', 'X', [qubit(3)], [qubit(2)])],
    ...overrides,
});

describe('buildCompositePreview', () => {
    /**
     * The whole point of the panel: it shows the gate, not the call. Wherever `bell` is dropped, its
     * body has to come out on rows `a` and `b`.
     */
    it('puts the body on parameter rows, not on the wires of the call', () => {
        const preview = buildCompositePreview(bell());

        expect(preview.portLabels).toEqual(['a', 'b']);
        expect(preview.operations.map((placed) => ({ id: placed.operation.id, ...placed }))).toMatchObject([
            { id: 'body-h', column: 0, targetRows: [0], controlRows: [] },
            { id: 'body-cx', column: 1, targetRows: [1], controlRows: [0] },
        ]);
    });

    it('follows the parameter order even when the call passes its qubits reversed', () => {
        const preview = buildCompositePreview(bell({ targetQubits: [qubit(3), qubit(2)] }));

        // `h` still acts on the first parameter, which is now bound to q[3].
        expect(preview.operations.map((placed) => placed.targetRows)).toEqual([[1], [0]]);
    });

    /** Same ASAP pass as the circuit, so the panel groups the body the way ungrouping would show it. */
    it('lays independent operations out side by side', () => {
        const preview = buildCompositePreview(
            bell({
                body: [gate('body-h', 'H', [qubit(2)]), gate('body-x', 'X', [qubit(3)])],
            }),
        );

        expect(preview.columnCount).toBe(1);
        expect(preview.operations.map((placed) => placed.column)).toEqual([0, 0]);
    });

    /** A declared parameter the body never touches still gets a wire — it belongs to the gate. */
    it('keeps a row for an unused parameter', () => {
        const preview = buildCompositePreview(
            bell({
                targetQubits: [qubit(0), qubit(1), qubit(2)],
                portLabels: ['a', 'b', 'c'],
                usedQubitPositions: [0],
                body: [gate('body-h', 'H', [qubit(0)])],
            }),
        );

        expect(preview.portLabels).toEqual(['a', 'b', 'c']);
    });

    it('reports what it had to leave out instead of growing without end', () => {
        const body = Array.from({ length: MAX_PREVIEW_COLUMNS + 3 }, (_, index) =>
            gate(`body-${index}`, 'H', [qubit(2)]),
        );
        const preview = buildCompositePreview(bell({ body }));

        expect(preview.columnCount).toBe(MAX_PREVIEW_COLUMNS);
        expect(preview.hiddenOperations).toBe(3);
    });

    it('draws nothing for an empty body', () => {
        const preview = buildCompositePreview(bell({ body: [] }));

        expect(preview.operations).toEqual([]);
        expect(preview.columnCount).toBe(0);
    });

    /**
     * Impossible for a body the backend produced — it is bound to the call's qubits — but a wrong
     * row would silently claim the gate acts on a parameter it does not.
     */
    it('drops an operation that names a qubit the call does not pass', () => {
        const preview = buildCompositePreview(
            bell({ body: [gate('body-h', 'H', [qubit(2)]), gate('foreign', 'X', [qubit(7)])] }),
        );

        expect(preview.operations.map((placed) => placed.operation.id)).toEqual(['body-h']);
    });
});
