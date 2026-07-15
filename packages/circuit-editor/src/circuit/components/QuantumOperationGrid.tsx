import { RegisterResponse } from '@quak/circuit-core';
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
}

export function QuantumOperationGrid({
    uiLayers,
    registers,
    isOperationDragging,
    removeQuantumOperation,
    setDraggingOperationId,
    setHoverPos,
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
