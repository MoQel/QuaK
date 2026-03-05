import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    MeasurementDto,
    MoveQuantumOperationRequest,
} from '@/api/dto/circuit.ts';
import { DragData, FlatQubit, HoverPos, UiLayer } from '@/views/circuit-view/util/types.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { getOperationDefinition } from '@/lib/operations.ts';

interface DropzoneGridProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    projectId: string | undefined;
    flatQubits: FlatQubit[];
    uiLayers: UiLayer[];
    activeDropZones: Set<string>;
    setHoverPos: React.Dispatch<React.SetStateAction<HoverPos | null>>;
    setDraggingOperationId: (id: string | null) => void;
}

export function DropzoneGrid({
    circuit,
    setCircuit,
    projectId,
    flatQubits,
    uiLayers,
    activeDropZones,
    setHoverPos,
    setDraggingOperationId,
}: Readonly<DropzoneGridProps>) {
    const { addQuantumOperation, moveQuantumOperation } = createCircuitService(circuit, projectId, setCircuit);

    const dispatch = useDispatch();

    const handleDragOver = (e: React.DragEvent, qubitIdx: number, layerIdx: number) => {
        e.preventDefault();
        // Use a functional update to access the latest state without triggering unnecessary re-renders.
        // Returning the previous value unchanged causes React to bail out of the render cycle,
        // preventing performance degradation from rapid mousemove events (render thrashing).
        setHoverPos((prev) => {
            if (prev?.qubitIdx === qubitIdx && prev?.layerIdx === layerIdx) {
                return prev;
            }
            return { qubitIdx, layerIdx };
        });
    };

    /** Creates a lookup map of the server-side circuit state. */
    const createCircuitLookupMap = () => {
        const originalPositions = new Map<
            string,
            {
                layerIdx: number;
                targetQubits: ElementSelectorDto[];
                controlQubits: ElementSelectorDto[];
            }
        >();

        if (!circuit) return originalPositions;

        for (const [layerIdx, layer] of circuit.layers.entries()) {
            for (const op of layer.quantumOperations) {
                originalPositions.set(op.id!, {
                    layerIdx,
                    targetQubits: op.targetQubits,
                    controlQubits: op.controlQubits,
                });
            }
        }
        return originalPositions;
    };

    /**
     * Compares the current circuit state against the UI layer representation to determine
     * whether any operation has shifted to a different layer or qubit position.
     * Used to avoid sending unnecessary move requests to the API when nothing has changed.
     */
    const hasCircuitStateChanged = useCallback(
        (operationToMove: MoveQuantumOperationRequest): boolean => {
            if (!circuit) return false;

            const originalPositions = createCircuitLookupMap();

            // Check if the operation to move has moved.
            const original = originalPositions.get(operationToMove.quantumOperationId);
            if (!original) return false;

            const isSameLayer = original.layerIdx === operationToMove.layerIdx;
            const isSameTarget = JSON.stringify(original.targetQubits) === JSON.stringify(operationToMove.targetQubits);
            const isSameControl =
                JSON.stringify(original.controlQubits) === JSON.stringify(operationToMove.controlQubits);

            if (!(isSameLayer && isSameTarget && isSameControl)) return true;

            // Check if any other operation has moved (due to temporary detachment of the operation to move).
            for (let layerIdx = 0; layerIdx < uiLayers.length; layerIdx++) {
                for (const op of uiLayers[layerIdx].quantumOperations) {
                    const original = originalPositions.get(op.id!);
                    if (!original) continue;

                    const isSameLayer = original.layerIdx === layerIdx;
                    const isSameTarget = JSON.stringify(original.targetQubits) === JSON.stringify(op.targetQubits);
                    const isSameControl = JSON.stringify(original.controlQubits) === JSON.stringify(op.controlQubits);

                    if (!(isSameLayer && isSameTarget && isSameControl)) return true;
                }
            }

            return false;
        },
        [circuit, uiLayers],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, regId: string, regIdx: number, layerIdx: number) => {
            e.preventDefault();
            try {
                const data: DragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                const operationDefinition = getOperationDefinition(data.operationIdentifier);
                const controlSize = operationDefinition.controlSize;
                const targetSize = operationDefinition.targetSize;

                const controlQubits: ElementSelectorDto[] = Array.from({ length: controlSize }, (_, i) => ({
                    registerId: regId,
                    index: regIdx + i,
                }));

                const targetQubits: ElementSelectorDto[] = Array.from({ length: targetSize }, (_, i) => ({
                    registerId: regId,
                    index: regIdx + controlSize + i,
                }));

                switch (data.origin) {
                    case 'library': {
                        if (operationDefinition.type === 'ELEMENTARY_QUANTUM_GATE') {
                            const operation: ElementaryQuantumGateDto = {
                                type: 'ELEMENTARY_QUANTUM_GATE',
                                identifier: data.operationIdentifier,
                                inverseForm: false,
                                targetQubits,
                                controlQubits,
                                rotationAngle: Math.PI / 2, // standard rotation
                            };
                            addQuantumOperation({ quantumOperation: operation, layerIdx });
                        } else if (operationDefinition.type === 'MEASUREMENT') {
                            const operation: MeasurementDto = {
                                type: 'MEASUREMENT',
                                identifier: data.operationIdentifier,
                                inverseForm: false,
                                targetQubits,
                                controlQubits,
                                classicBits: [],
                            };
                            addQuantumOperation({ quantumOperation: operation, layerIdx });
                        }
                        break;
                    }
                    case 'circuit': {
                        const payload: MoveQuantumOperationRequest = {
                            quantumOperationId: data.id!,
                            layerIdx,
                            targetQubits,
                            controlQubits,
                        };
                        if (hasCircuitStateChanged(payload)) {
                            moveQuantumOperation(payload);
                        }
                        break;
                    }
                    default:
                        console.error(`Unknown drag origin: ${(data as any).origin}`);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse drag data', error);
            } finally {
                dispatch(stopOperationDrag());
                setHoverPos(null);
                setDraggingOperationId(null);
            }
        },
        [addQuantumOperation, moveQuantumOperation, hasCircuitStateChanged, dispatch],
    );

    return (
        <div className="absolute inset-0 z-10">
            {flatQubits.map((qubit, qIdx) =>
                Array.from({ length: uiLayers.length + 1 }).map((_, layerIdx) => {
                    const isZoneActive = activeDropZones.has(`${qIdx}-${layerIdx}`);
                    if (!isZoneActive) return null;

                    return (
                        <div
                            key={`drop-${qIdx}-${layerIdx}`}
                            style={{
                                position: 'absolute',
                                left: layerIdx * CELL_WIDTH,
                                top: qIdx * QUBIT_HEIGHT,
                                width: CELL_WIDTH,
                                height: QUBIT_HEIGHT,
                            }}
                            onDragOver={(e) => handleDragOver(e, qIdx, layerIdx)}
                            onDragLeave={() => setHoverPos(null)}
                            onDrop={(e) => handleDrop(e, qubit.regId, qubit.relQubitIdx, layerIdx)}
                        />
                    );
                }),
            )}
        </div>
    );
}
