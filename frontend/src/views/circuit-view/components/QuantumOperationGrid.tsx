import { RegisterResponse } from '@/api/dto/circuit.ts';
import { ElementaryQuantumGate } from '@/views/circuit-view/components/ElementaryQuantumGate.tsx';
import { UiLayer } from '@/views/circuit-view/util/types.ts';
import { useDispatch } from 'react-redux';
import { startOperationDrag, stopOperationDrag } from '@/store/slices/dragOperationSlice.ts';

interface QuantumOperationGridProps {
    uiLayers: UiLayer[];
    registers: RegisterResponse[];
    isOperationDragging: boolean;
    removeQuantumOperation: (operationId: string) => void;
    setDraggingOperationId: (id: string | null) => void;
    setHoverPos: (pos: null) => void;
}

export function QuantumOperationGrid({
    uiLayers,
    registers,
    isOperationDragging,
    removeQuantumOperation,
    setDraggingOperationId,
    setHoverPos,
}: Readonly<QuantumOperationGridProps>) {
    const dispatch = useDispatch();

    const handleOperationDragStart = (operationId: string, operationSize: number) => {
        dispatch(startOperationDrag(operationSize));
        setDraggingOperationId(operationId);
    };

    const handleOperationDragEnd = () => {
        dispatch(stopOperationDrag());
        setHoverPos(null);
        setDraggingOperationId(null);
    };

    return (
        <div className={`absolute inset-0 z-20 ${isOperationDragging ? 'pointer-events-none' : ''}`}>
            {uiLayers.map((layer, layerIdx) =>
                layer.quantumOperations.map((op) => {
                    if (op.type === 'DUMMY') return null;

                    return (
                        <ElementaryQuantumGate
                            key={op.id}
                            operation={op}
                            registers={registers}
                            layerIdx={layerIdx}
                            onDragStart={(operationSize) => handleOperationDragStart(op.id!, operationSize)}
                            onDragEnd={handleOperationDragEnd}
                            onDelete={() => removeQuantumOperation(op.id!)}
                        />
                    );
                }),
            )}
        </div>
    );
}
