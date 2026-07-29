import { QuantumOperationDto, RegisterResponse } from '@quak/circuit-core';
import { ElementaryQuantumGate } from '../../circuit/components/ElementaryQuantumGate.tsx';
import { UiLayer } from '../../circuit/util/types.ts';
import { useCircuitDrag } from '../../CircuitDragContext.tsx';

interface QuantumOperationGridProps {
    uiLayers: UiLayer[];
    registers: RegisterResponse[];
    isOperationDragging: boolean;
    removeQuantumOperation: (operationId: string) => void;
    setDraggingOperationId: (id: string | null) => void;
    setHoverPos: (pos: null) => void;
    draggingOperation: { op: QuantumOperationDto; layerIdx: number } | null;
}

export function QuantumOperationGrid({
    uiLayers,
    registers,
    isOperationDragging,
    removeQuantumOperation,
    setDraggingOperationId,
    setHoverPos,
    draggingOperation,
}: Readonly<QuantumOperationGridProps>) {
    const { startOperationDrag, stopOperationDrag } = useCircuitDrag();

    const handleOperationDragStart = (operationId: string, operationSize: number) => {
        startOperationDrag(operationSize);
        setDraggingOperationId(operationId);
    };

    const handleOperationDragEnd = () => {
        stopOperationDrag();
        setHoverPos(null);
        setDraggingOperationId(null);
    };

    // Single flat, keyed list so React reuses DOM nodes across drag transitions.
    // The dragged operation is rendered as a ghost at its original position instead
    // of being unmounted: the browser only fires dragend reliably if the drag source
    // element stays in the DOM (dropping outside a valid zone would otherwise leave
    // the drag state stuck and the gate invisible). It is prepended so React never
    // has to move its DOM node while the drag is running.
    const renderedOperations: { op: QuantumOperationDto; layerIdx: number; isGhost: boolean }[] = [
        ...(draggingOperation ? [{ ...draggingOperation, isGhost: true }] : []),
        ...uiLayers.flatMap((layer, layerIdx) =>
            layer.quantumOperations
                .filter((op) => op.type !== 'DUMMY' && op.id !== draggingOperation?.op.id)
                .map((op) => ({ op, layerIdx, isGhost: false })),
        ),
    ];

    return (
        <div className={`absolute inset-0 z-20 ${isOperationDragging ? 'pointer-events-none' : ''}`}>
            {renderedOperations.map(({ op, layerIdx, isGhost }) => (
                <ElementaryQuantumGate
                    key={op.id}
                    operation={op}
                    registers={registers}
                    layerIdx={layerIdx}
                    isGhost={isGhost}
                    onDragStart={(operationSize) => handleOperationDragStart(op.id!, operationSize)}
                    onDragEnd={handleOperationDragEnd}
                    onDelete={() => removeQuantumOperation(op.id!)}
                />
            ))}
        </div>
    );
}
