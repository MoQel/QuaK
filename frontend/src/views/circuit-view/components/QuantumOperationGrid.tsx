import { isCompositeGate, QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { CompositeQuantumGate } from '@/views/circuit-view/components/CompositeQuantumGate.tsx';
import { ElementaryQuantumGate } from '@/views/circuit-view/components/ElementaryQuantumGate.tsx';
import { UiLayer } from '@/views/circuit-view/util/types.ts';
import { useDispatch } from 'react-redux';
import { startOperationDrag, stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';

interface QuantumOperationGridProps {
    uiLayers: UiLayer[];
    registers: RegisterResponse[];
    isOperationDragging: boolean;
    removeQuantumOperation: (operationId: string) => void;
    /** Replaces a composite gate by the operations it is made of. */
    ungroupQuantumOperation: (operationId: string) => void;
    setDraggingOperationId: (id: string | null) => void;
    setHoverPos: (pos: null) => void;
    draggingOperation: { op: QuantumOperationDto; layerIdx: number } | null;
}

export function QuantumOperationGrid({
    uiLayers,
    registers,
    isOperationDragging,
    removeQuantumOperation,
    ungroupQuantumOperation,
    setDraggingOperationId,
    setHoverPos,
    draggingOperation,
}: Readonly<QuantumOperationGridProps>) {
    const dispatch = useDispatch();

    const handleOperationDragStart = (operationId: string, operationSize: number, grabOffset: number) => {
        dispatch(startOperationDrag({ size: operationSize, grabOffset }));
        setDraggingOperationId(operationId);
    };

    const handleOperationDragEnd = () => {
        dispatch(stopOperationDrag());
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
            {renderedOperations.map(({ op, layerIdx, isGhost }) =>
                // A user-defined gate is one box rather than a set of target/control markers.
                isCompositeGate(op) ? (
                    <CompositeQuantumGate
                        key={op.id}
                        operation={op}
                        registers={registers}
                        layerIdx={layerIdx}
                        isGhost={isGhost}
                        onDragStart={(operationSize, grabOffset) =>
                            handleOperationDragStart(op.id!, operationSize, grabOffset)
                        }
                        onDragEnd={handleOperationDragEnd}
                        onDelete={() => removeQuantumOperation(op.id!)}
                        onUngroup={() => ungroupQuantumOperation(op.id!)}
                    />
                ) : (
                    <ElementaryQuantumGate
                        key={op.id}
                        operation={op}
                        registers={registers}
                        layerIdx={layerIdx}
                        isGhost={isGhost}
                        onDragStart={(operationSize, grabOffset) =>
                            handleOperationDragStart(op.id!, operationSize, grabOffset)
                        }
                        onDragEnd={handleOperationDragEnd}
                        onDelete={() => removeQuantumOperation(op.id!)}
                    />
                ),
            )}
        </div>
    );
}
