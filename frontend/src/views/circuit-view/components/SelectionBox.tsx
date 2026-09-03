import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { CellRect } from '@/views/circuit-view/util/selection.ts';

interface SelectionBoxProps {
    rect: CellRect;
}

/**
 * The rectangle being dragged out over the circuit, before it becomes a repetition frame.
 *
 * Drawn in the frame's own colour and dash pattern so it is obvious what it is about to turn into,
 * and `pointer-events-none` so it never eats the pointer-up that ends the very drag drawing it.
 */
export function SelectionBox({ rect }: Readonly<SelectionBoxProps>) {
    return (
        <div
            className="absolute z-45 rounded-sm border-2 border-dashed pointer-events-none"
            style={{
                left: rect.firstColumn * CELL_WIDTH,
                top: rect.topWire * QUBIT_HEIGHT,
                width: (rect.lastColumn - rect.firstColumn + 1) * CELL_WIDTH,
                height: (rect.bottomWire - rect.topWire + 1) * QUBIT_HEIGHT,
                borderColor: 'var(--loop-frame)',
                backgroundColor: 'color-mix(in srgb, var(--loop-frame) 12%, transparent)',
            }}
        />
    );
}
