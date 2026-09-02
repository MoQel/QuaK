import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { FlatQubit, HoverPos } from '@/views/circuit-view/util/types.ts';

interface DropPlaceholderProps {
    hoverPos: HoverPos | null;
    draggingOperationSize: number;
    flatQubits: FlatQubit[];
}

export function DropPlaceholder({ hoverPos, draggingOperationSize, flatQubits }: Readonly<DropPlaceholderProps>) {
    if (!hoverPos) return null;

    const top = flatQubits[hoverPos.qubitIdx]?.visualY ?? hoverPos.qubitIdx * QUBIT_HEIGHT;

    return (
        <div
            className="absolute border-2 border-dashed pointer-events-none z-50 border-primary/50 bg-primary/10"
            style={{
                top,
                left: hoverPos.layerIdx * CELL_WIDTH,
                width: CELL_WIDTH,
                height: draggingOperationSize * QUBIT_HEIGHT,
            }}
        />
    );
}
