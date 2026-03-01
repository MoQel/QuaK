import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { HoverPos } from '@/views/circuit-view/util/types.ts';

interface DropPlaceholderProps {
    hoverPos: HoverPos | null;
    draggingOperationSize: number;
}

export function DropPlaceholder({ hoverPos, draggingOperationSize }: Readonly<DropPlaceholderProps>) {
    if (!hoverPos) return null;

    return (
        <div
            className="absolute border-2 border-dashed pointer-events-none z-50 border-primary/50 bg-primary/10"
            style={{
                top: hoverPos.qubitIdx * QUBIT_HEIGHT,
                left: hoverPos.layerIdx * CELL_WIDTH,
                width: CELL_WIDTH,
                height: draggingOperationSize * QUBIT_HEIGHT,
            }}
        />
    );
}
