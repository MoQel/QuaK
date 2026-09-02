import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CompositionBox } from './CompositionBox.tsx';
import type { CompositeQuantumGateDto } from '@/api/dto/circuit.ts';
import { REGISTER_TYPE_QUANTUM } from '@/api/dto/circuit.ts';
import { QUBIT_HEIGHT, REGISTER_HEADER_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import type { FlatQubit } from '@/views/circuit-view/util/types.ts';

// The box takes its rows from the rendered wire list, so the fixture is one four-wire quantum
// register with no header offset: wire i sits at i * QUBIT_HEIGHT.
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

const bell = (overrides: Partial<CompositeQuantumGateDto> = {}): CompositeQuantumGateDto => ({
    id: 'op1',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [
        { registerId: 'r1', index: 0 },
        { registerId: 'r1', index: 1 },
    ],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [
        {
            id: 'b1',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'H',
            inverseForm: false,
            targetQubits: [{ registerId: 'r1', index: 0 }],
            controlQubits: [],
            rotationAngle: 0,
        },
    ],
    ...overrides,
});

const renderGate = (
    operation: CompositeQuantumGateDto,
    handlers: { onUngroup?: () => void; onDelete?: () => void } = {},
) =>
    render(
        <CompositionBox
            operation={operation}
            flatQubits={flatQubits}
            layerIdx={0}
            onDragStart={vi.fn()}
            onDragEnd={vi.fn()}
            onDelete={handlers.onDelete ?? vi.fn()}
            onUngroup={handlers.onUngroup ?? vi.fn()}
        />,
    );

describe('CompositionBox', () => {
    it('shows the gate name and one port label per used parameter', () => {
        renderGate(bell());

        expect(screen.getByText('bell')).toBeTruthy();
        expect(screen.getByText('a')).toBeTruthy();
        expect(screen.getByText('b')).toBeTruthy();
    });

    it('spans every wire between its topmost and bottommost qubit', () => {
        const { container } = renderGate(
            bell({
                targetQubits: [
                    { registerId: 'r1', index: 0 },
                    { registerId: 'r1', index: 2 },
                ],
            }),
        );

        const wrapper = container.firstElementChild as HTMLElement;
        expect(wrapper.style.top).toBe('0px');
        // Two wires apart, so the box covers three rows.
        expect(wrapper.style.height).toBe(`${2 * QUBIT_HEIGHT + QUBIT_HEIGHT}px`);
    });

    /**
     * Rows are not evenly spaced from the top of the canvas: a register header sits above the first
     * wire, and a classical section adds a gap. Positioning the box by qubit *index* therefore drew
     * it a header's height too high, off its own wires.
     */
    it('sits on its wires when a register header offsets them', () => {
        const offsetQubits = flatQubits.map((qubit, i) => ({
            ...qubit,
            visualY: REGISTER_HEADER_HEIGHT + i * QUBIT_HEIGHT,
        }));

        const { container } = render(
            <CompositionBox
                operation={bell({
                    targetQubits: [
                        { registerId: 'r1', index: 1 },
                        { registerId: 'r1', index: 2 },
                    ],
                })}
                flatQubits={offsetQubits}
                layerIdx={0}
                onDragStart={vi.fn()}
                onDragEnd={vi.fn()}
                onDelete={vi.fn()}
                onUngroup={vi.fn()}
            />,
        );

        const wrapper = container.firstElementChild as HTMLElement;
        expect(wrapper.style.top).toBe(`${REGISTER_HEADER_HEIGHT + QUBIT_HEIGHT}px`);
        expect(wrapper.style.height).toBe(`${2 * QUBIT_HEIGHT}px`);
    });

    /**
     * The box shows the gate's full signature: a parameter the body never touches is still bound to
     * a wire, so hiding its port would make the gate look narrower than it is.
     */
    it('draws a port for every declared parameter, used or not', () => {
        renderGate(
            bell({
                identifier: 'skip',
                targetQubits: [
                    { registerId: 'r1', index: 0 },
                    { registerId: 'r1', index: 1 },
                    { registerId: 'r1', index: 2 },
                    { registerId: 'r1', index: 3 },
                ],
                portLabels: ['a', 'b', 'c', 'd'],
                // Only c and d are touched by the body.
                usedQubitPositions: [2, 3],
            }),
        );

        for (const label of ['a', 'b', 'c', 'd']) {
            expect(screen.getByText(label)).toBeTruthy();
        }
    });

    /** Ports follow the parameter binding, not the wire order, so a swapped call swaps the labels. */
    it('places port labels on the wire each parameter is bound to', () => {
        renderGate(
            bell({
                targetQubits: [
                    { registerId: 'r1', index: 2 },
                    { registerId: 'r1', index: 0 },
                ],
            }),
        );

        // 'a' is bound to wire 2, which is the bottom row of a box spanning wires 0..2.
        const portA = screen.getByText('a') as HTMLElement;
        const portB = screen.getByText('b') as HTMLElement;
        expect(parseFloat(portA.style.top)).toBeGreaterThan(parseFloat(portB.style.top));
    });

    /**
     * Starts a drag on the rendered box, with the pointer `clientY` pixels down the page and the box
     * itself starting at y = 0.
     */
    const startDrag = (onDragStart: ReturnType<typeof vi.fn>, clientY = 0) => {
        vi.useFakeTimers();
        const { container } = render(
            <CompositionBox
                operation={bell()}
                flatQubits={flatQubits}
                layerIdx={0}
                onDragStart={onDragStart}
                onDragEnd={vi.fn()}
                onDelete={vi.fn()}
                onUngroup={vi.fn()}
            />,
        );

        const wrapper = container.firstElementChild as HTMLElement;
        wrapper.getBoundingClientRect = () => ({
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });

        const event = new Event('dragstart', { bubbles: true });
        Object.defineProperty(event, 'dataTransfer', { value: { setData: vi.fn(), effectAllowed: '' } });
        Object.defineProperty(event, 'clientY', { value: clientY });
        wrapper.dispatchEvent(event);
        vi.runAllTimers();
        vi.useRealTimers();
    };

    it('reports its full qubit count when a drag starts, so a move keeps every wire', () => {
        const onDragStart = vi.fn();

        startDrag(onDragStart);

        expect(onDragStart).toHaveBeenCalledWith(2, 0);
    });

    /**
     * Grabbing the box low must be reported, otherwise the drop anchor lands under the pointer and
     * the box jumps down by the grab distance.
     */
    it('reports which wire it was grabbed by', () => {
        const onDragStart = vi.fn();

        // Pointer on the second wire of the box (wires are QUBIT_HEIGHT apart).
        startDrag(onDragStart, QUBIT_HEIGHT + 5);

        expect(onDragStart).toHaveBeenCalledWith(2, 1);
    });

    /**
     * Ungroup needs a trigger of its own: a plain click already deletes the gate, and the box has no
     * room for a control. Right-click is where the rest of the IDE puts per-element actions.
     */
    it('offers Ungroup on right-click', async () => {
        const onUngroup = vi.fn();
        const { container } = renderGate(bell(), { onUngroup });

        fireEvent.contextMenu(container.firstElementChild as HTMLElement);

        const item = await screen.findByText('Ungroup');
        fireEvent.click(item);

        expect(onUngroup).toHaveBeenCalledTimes(1);
    });
});
