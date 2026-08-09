import { isCompositeGate, LoopBlockDto, QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { innermostBlockCovering } from '@/lib/loopBlocks.ts';
import { CompositeQuantumGate } from '@/views/circuit-view/components/CompositeQuantumGate.tsx';
import { ElementaryQuantumGate } from '@/views/circuit-view/components/ElementaryQuantumGate.tsx';
import { UiLayer } from '@/views/circuit-view/util/types.ts';
import { useDispatch } from 'react-redux';
import { startOperationDrag, stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';

interface QuantumOperationGridProps {
    uiLayers: UiLayer[];
    registers: RegisterResponse[];
    isOperationDragging: boolean;
    /** Repetition frames, so each gate knows whether it sits in one and which to offer removing. */
    loopBlocks: LoopBlockDto[];
    removeQuantumOperation: (operationId: string) => void;
    /** Drops a repetition frame, leaving its gates where they are. */
    removeLoopBlock: (loopBlockId: string) => void;
    /** Replaces a composite gate by the operations it is made of. */
    ungroupQuantumOperation: (operationId: string) => void;
    /** Asks for the angle editor; the gate itself decides whether it has an angle to edit. */
    editRotationAngle: (operation: QuantumOperationDto) => void;
    setDraggingOperationId: (id: string | null) => void;
    setHoverPos: (pos: null) => void;
    draggingOperation: { op: QuantumOperationDto; layerIdx: number } | null;
}

export function QuantumOperationGrid({
    uiLayers,
    registers,
    isOperationDragging,
    loopBlocks,
    removeQuantumOperation,
    removeLoopBlock,
    ungroupQuantumOperation,
    editRotationAngle,
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
            {renderedOperations.map(({ op, layerIdx, isGhost }) => {
                // The frame drawn tightest around this gate: it decides both the smaller rendering
                // and which loop the gate's context menu offers to remove.
                const enclosingLoop = op.id ? innermostBlockCovering(loopBlocks, op.id) : undefined;
                const onRemoveLoop = enclosingLoop ? () => removeLoopBlock(enclosingLoop.id) : undefined;

                // A user-defined gate is one box rather than a set of target/control markers.
                return isCompositeGate(op) ? (
                    <CompositeQuantumGate
                        key={op.id}
                        operation={op}
                        registers={registers}
                        layerIdx={layerIdx}
                        isGhost={isGhost}
                        isInLoop={enclosingLoop !== undefined}
                        loopRepeatCount={enclosingLoop?.repeatCount}
                        onDragStart={(operationSize, grabOffset) =>
                            handleOperationDragStart(op.id!, operationSize, grabOffset)
                        }
                        onDragEnd={handleOperationDragEnd}
                        onDelete={() => removeQuantumOperation(op.id!)}
                        onUngroup={() => ungroupQuantumOperation(op.id!)}
                        onRemoveLoop={onRemoveLoop}
                    />
                ) : (
                    <ElementaryQuantumGate
                        key={op.id}
                        operation={op}
                        registers={registers}
                        layerIdx={layerIdx}
                        isGhost={isGhost}
                        isInLoop={enclosingLoop !== undefined}
                        loopRepeatCount={enclosingLoop?.repeatCount}
                        onDragStart={(operationSize, grabOffset) =>
                            handleOperationDragStart(op.id!, operationSize, grabOffset)
                        }
                        onDragEnd={handleOperationDragEnd}
                        onDelete={() => removeQuantumOperation(op.id!)}
                        onRemoveLoop={onRemoveLoop}
                        onEditAngle={() => editRotationAngle(op)}
                    />
                );
            })}
        </div>
    );
}
