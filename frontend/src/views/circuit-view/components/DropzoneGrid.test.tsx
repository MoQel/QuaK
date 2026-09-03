import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store/store.ts';
import { DropzoneGrid } from './DropzoneGrid.tsx';
import type { CircuitResponse, CompositeQuantumGateDto } from '@/api/dto/circuit.ts';
import { REGISTER_TYPE_QUANTUM } from '@/api/dto/circuit.ts';
import { QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import type { DragData, FlatQubit, UiLayer } from '@/views/circuit-view/util/types.ts';

// One quantum register of four wires, laid out the way buildFlatQubits would: one row per qubit.
const flatQubits: FlatQubit[] = Array.from({ length: 4 }, (_, i) => ({
    regId: 'r1',
    regName: 'q',
    regIdx: 0,
    relQubitIdx: i,
    absQubitIdx: i,
    regType: REGISTER_TYPE_QUANTUM,
    section: 'quantum' as const,
    headerY: 0,
    registerSize: 4,
    isCollapsed: false,
    visualY: i * QUBIT_HEIGHT,
}));

const circuit: CircuitResponse = {
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
    layers: [],
};

const uiLayers: UiLayer[] = [{ quantumOperations: [] }];

/** Only wire 0 of layer 0 accepts a drop, so everything else is a declining cell. */
const activeDropZones = new Set(['0-0']);

const renderGrid = (setHoverPos: ReturnType<typeof vi.fn>, grabOffset = 0, size = 1, setCircuit = vi.fn()) =>
    render(
        <Provider store={store}>
            <DropzoneGrid
                circuit={circuit}
                setCircuit={setCircuit}
                flatQubits={flatQubits}
                uiLayers={uiLayers}
                activeDropZones={activeDropZones}
                draggingOperationSize={size}
                draggingGrabOffset={grabOffset}
                setHoverPos={setHoverPos}
                setDraggingOperationId={vi.fn()}
            />
        </Provider>,
    );

/** The grid's cells, in render order: wire by wire, layer by layer within each wire. */
const cells = (container: HTMLElement) => [...container.firstElementChild!.children] as HTMLElement[];

const drag = (element: HTMLElement, type: 'dragenter' | 'dragover' | 'dragleave') =>
    element.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));

const drop = (element: HTMLElement, data: DragData) => {
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { getData: () => JSON.stringify(data) } });
    element.dispatchEvent(event);
};

/** `gate bell a, b { h a; cx a, b; }`, as collected from a call on the *lower* two wires. */
const bellTemplate: CompositeQuantumGateDto = {
    id: 'template',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [
        { registerId: 'r1', index: 2 },
        { registerId: 'r1', index: 3 },
    ],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [
        {
            id: 'template-h',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'H',
            inverseForm: false,
            targetQubits: [{ registerId: 'r1', index: 2 }],
            controlQubits: [],
            rotationAngle: 0,
        },
        {
            id: 'template-cx',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'X',
            inverseForm: false,
            targetQubits: [{ registerId: 'r1', index: 3 }],
            controlQubits: [{ registerId: 'r1', index: 2 }],
            rotationAngle: 0,
        },
    ],
};

/** Runs the updater the component handed to setCircuit, giving the circuit it would have produced. */
const resultOf = (setCircuit: ReturnType<typeof vi.fn>): CircuitResponse => {
    const updater = setCircuit.mock.calls[0][0] as (prev: CircuitResponse) => CircuitResponse;
    return updater(circuit);
};

describe('DropzoneGrid', () => {
    /** Holes in the grid used to be the source of the flicker; every position has a cell now. */
    it('renders a cell for every position, droppable or not', () => {
        const { container } = renderGrid(vi.fn());

        // 4 wires × (1 layer + 1 trailing column)
        expect(cells(container)).toHaveLength(8);
    });

    it('sets the hover position when entering a droppable cell', () => {
        const setHoverPos = vi.fn();
        const { container } = renderGrid(setHoverPos);

        drag(cells(container)[0], 'dragenter');

        expect(setHoverPos).toHaveBeenCalled();
    });

    /**
     * The point of the change: crossing a position that cannot take the drop must not wipe the
     * preview, otherwise the placeholder blinks away and back while the pointer travels.
     */
    it('keeps the preview when the pointer crosses a declining cell', () => {
        const setHoverPos = vi.fn();
        const { container } = renderGrid(setHoverPos);
        const [droppable, declining] = cells(container);

        drag(droppable, 'dragenter');
        setHoverPos.mockClear();

        // Real HTML5 order: the new cell's enter fires before the old cell's leave.
        drag(declining, 'dragenter');
        drag(droppable, 'dragleave');

        // No call at all means the preview was left exactly as it was.
        expect(setHoverPos).not.toHaveBeenCalled();
    });

    /** Leaving the grid altogether still has to clear it, or the placeholder would stick around. */
    it('clears the preview when the pointer leaves the cell it is on', () => {
        const setHoverPos = vi.fn();
        const { container } = renderGrid(setHoverPos);
        const [droppable] = cells(container);

        drag(droppable, 'dragenter');
        setHoverPos.mockClear();
        drag(droppable, 'dragleave');

        expect(setHoverPos).toHaveBeenCalledWith(null);
    });

    /**
     * A custom gate has no entry in the built-in catalogue, so without the template on the drag it
     * would be looked up as unknown and truncated to one qubit — the drop has to take its size and
     * its body from the dragged gate itself.
     */
    it('drops a custom gate from the library onto the wires it was dropped on', () => {
        const setCircuit = vi.fn();
        const { container } = renderGrid(vi.fn(), 0, 2, setCircuit);

        drop(cells(container)[0], { origin: 'library', operationIdentifier: 'bell', composite: bellTemplate });

        const dropped = resultOf(setCircuit).layers[0].quantumOperations[0] as CompositeQuantumGateDto;
        expect(dropped.type).toBe('COMPOSITE_QUANTUM_GATE');
        expect(dropped.identifier).toBe('bell');
        // Collected from wires 2 and 3, dropped on 0: the box *and* its body move along.
        expect(dropped.targetQubits).toEqual([
            { registerId: 'r1', index: 0 },
            { registerId: 'r1', index: 1 },
        ]);
        expect(dropped.body[0].targetQubits).toEqual([{ registerId: 'r1', index: 0 }]);
        expect(dropped.body[1].targetQubits).toEqual([{ registerId: 'r1', index: 1 }]);
        expect(dropped.body[1].controlQubits).toEqual([{ registerId: 'r1', index: 0 }]);
    });

    /** A copy is a new operation: sharing the template's ids would put two claims on one identity. */
    it('gives the dropped copy fresh ids, body included', () => {
        const setCircuit = vi.fn();
        const { container } = renderGrid(vi.fn(), 0, 2, setCircuit);

        drop(cells(container)[0], { origin: 'library', operationIdentifier: 'bell', composite: bellTemplate });

        const dropped = resultOf(setCircuit).layers[0].quantumOperations[0] as CompositeQuantumGateDto;
        const ids = [dropped.id, ...dropped.body.map((part) => part.id)];
        expect(ids).not.toContain('template');
        expect(ids).not.toContain('template-h');
        expect(ids).not.toContain('template-cx');
        expect(new Set(ids).size).toBe(ids.length);
    });

    /** A declining cell must not accept the drop: without preventDefault the browser refuses it. */
    it('does not accept a drop on a declining cell', () => {
        const { container } = renderGrid(vi.fn());
        const [droppable, declining] = cells(container);

        const droppableEvent = new Event('dragover', { bubbles: true, cancelable: true });
        droppable.dispatchEvent(droppableEvent);
        expect(droppableEvent.defaultPrevented).toBe(true);

        const decliningEvent = new Event('dragover', { bubbles: true, cancelable: true });
        declining.dispatchEvent(decliningEvent);
        expect(decliningEvent.defaultPrevented).toBe(false);
    });
});
