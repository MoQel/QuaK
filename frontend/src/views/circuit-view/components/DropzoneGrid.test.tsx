import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store/store.ts';
import { DropzoneGrid } from './DropzoneGrid.tsx';
import type { CircuitResponse } from '@/api/dto/circuit.ts';
import type { FlatQubit, UiLayer } from '@/views/circuit-view/util/types.ts';

const flatQubits: FlatQubit[] = Array.from({ length: 4 }, (_, i) => ({
    regId: 'r1',
    regName: 'q',
    regIdx: 0,
    relQubitIdx: i,
    absQubitIdx: i,
}));

const circuit: CircuitResponse = {
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
    layers: [],
};

const uiLayers: UiLayer[] = [{ quantumOperations: [] }];

/** Only wire 0 of layer 0 accepts a drop, so everything else is a declining cell. */
const activeDropZones = new Set(['0-0']);

const renderGrid = (setHoverPos: ReturnType<typeof vi.fn>, grabOffset = 0, size = 1) =>
    render(
        <Provider store={store}>
            <DropzoneGrid
                circuit={circuit}
                setCircuit={vi.fn()}
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
