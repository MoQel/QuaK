import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { REGISTER_TYPE_QUANTUM } from '@/api/dto/circuit.ts';
import type {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    MoveQuantumOperationRequest,
} from '@/api/dto/circuit.ts';
import type { DragData, FlatQubit, HoverPos, UiLayer } from '@/views/circuit-view/util/types.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { getOperationDefinition } from '@/lib/operations.ts';
import type { OperationIdentifier } from '@/lib/operations.ts';

interface DropzoneGridProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
    flatQubits: FlatQubit[];
    uiLayers: UiLayer[];
    activeDropZones: Set<string>;
    setHoverPos: React.Dispatch<React.SetStateAction<HoverPos | null>>;
    setDraggingOperationId: (id: string | null) => void;
    onRequestMeasurementTarget?: (context: {
        layerIdx: number;
        targetQubits: ElementSelectorDto[];
        controlQubits: ElementSelectorDto[];
        operationIdentifier: OperationIdentifier;
    }) => void;
}

export function DropzoneGrid({
    circuit,
    setCircuit,
    flatQubits,
    uiLayers,
    activeDropZones,
    setHoverPos,
    setDraggingOperationId,
    onRequestMeasurementTarget,
}: Readonly<DropzoneGridProps>) {
    const { addQuantumOperation, moveQuantumOperation } = createCircuitService(circuit, setCircuit);

    const dispatch = useDispatch();

    const selectorsEqual = (left: ElementSelectorDto[] = [], right: ElementSelectorDto[] = []) =>
        JSON.stringify(left) === JSON.stringify(right);

    const getClassicBits = (
        operation:
            | {
                  type: string;
                  classicBits?: ElementSelectorDto[];
              }
            | undefined,
    ) => (operation?.type === 'MEASUREMENT' ? operation.classicBits ?? [] : []);

    const hasSamePosition = (
        original: {
            layerIdx: number;
            targetQubits: ElementSelectorDto[];
            controlQubits: ElementSelectorDto[];
            classicBits?: ElementSelectorDto[];
        },
        layerIdx: number,
        targetQubits: ElementSelectorDto[],
        controlQubits: ElementSelectorDto[],
        classicBits: ElementSelectorDto[] = [],
    ) =>
        original.layerIdx === layerIdx &&
        selectorsEqual(original.targetQubits, targetQubits) &&
        selectorsEqual(original.controlQubits, controlQubits) &&
        selectorsEqual(original.classicBits ?? [], classicBits);

    const handleDragOver = (e: React.DragEvent, qubitIdx: number, layerIdx: number) => {
        e.preventDefault();
        setHoverPos((prev) => {
            if (prev?.qubitIdx === qubitIdx && prev?.layerIdx === layerIdx) {
                return prev;
            }
            return { qubitIdx, layerIdx };
        });
    };

    const hasCircuitStateChanged = useCallback(
        (operationToMove: MoveQuantumOperationRequest): boolean => {
            if (!circuit) return false;

            const originalPositions = new Map<
                string,
                {
                    layerIdx: number;
                    targetQubits: ElementSelectorDto[];
                    controlQubits: ElementSelectorDto[];
                    classicBits?: ElementSelectorDto[];
                }
            >();

            for (const [originalLayerIdx, layer] of circuit.layers.entries()) {
                for (const operation of layer.quantumOperations) {
                    originalPositions.set(operation.id!, {
                        layerIdx: originalLayerIdx,
                        targetQubits: operation.targetQubits,
                        controlQubits: operation.controlQubits,
                        classicBits: getClassicBits(operation),
                    });
                }
            }

            const original = originalPositions.get(operationToMove.quantumOperationId);
            if (!original) return false;

            if (
                !hasSamePosition(
                    original,
                    operationToMove.layerIdx,
                    operationToMove.targetQubits,
                    operationToMove.controlQubits,
                    operationToMove.classicBits,
                )
            ) {
                return true;
            }

            for (let movedLayerIdx = 0; movedLayerIdx < uiLayers.length; movedLayerIdx++) {
                for (const operation of uiLayers[movedLayerIdx].quantumOperations) {
                    const currentOriginal = originalPositions.get(operation.id!);
                    if (!currentOriginal) continue;

                    if (
                        !hasSamePosition(
                            currentOriginal,
                            movedLayerIdx,
                            operation.targetQubits,
                            operation.controlQubits,
                            getClassicBits(operation),
                        )
                    ) {
                        return true;
                    }
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
                const controlQubits: ElementSelectorDto[] = Array.from(
                    { length: operationDefinition.controlSize },
                    (_, index) => ({
                        registerId: regId,
                        index: regIdx + index,
                    }),
                );
                const targetQubits: ElementSelectorDto[] = Array.from(
                    { length: operationDefinition.targetSize },
                    (_, index) => ({
                        registerId: regId,
                        index: regIdx + operationDefinition.controlSize + index,
                    }),
                );

                switch (data.origin) {
                    case 'library': {
                        if (operationDefinition.type === 'ELEMENTARY_QUANTUM_GATE') {
                            const operation: ElementaryQuantumGateDto = {
                                type: 'ELEMENTARY_QUANTUM_GATE',
                                identifier: data.operationIdentifier,
                                inverseForm: false,
                                targetQubits,
                                controlQubits,
                                rotationAngle: Math.PI / 2,
                            };
                            addQuantumOperation({ quantumOperation: operation, layerIdx });
                        } else if (operationDefinition.type === 'MEASUREMENT') {
                            onRequestMeasurementTarget?.({
                                layerIdx,
                                targetQubits,
                                controlQubits: [],
                                operationIdentifier: data.operationIdentifier,
                            });
                        }
                        break;
                    }
                    case 'circuit': {
                        if (!data.id) break;

                        const operationToMove = circuit?.layers
                            .flatMap((layer) => layer.quantumOperations)
                            .find((operation) => operation.id === data.id);
                        const payload: MoveQuantumOperationRequest = {
                            quantumOperationId: data.id,
                            layerIdx,
                            targetQubits,
                            controlQubits: operationToMove?.type === 'MEASUREMENT' ? [] : controlQubits,
                            classicBits:
                                operationToMove?.type === 'MEASUREMENT' ? getClassicBits(operationToMove) : undefined,
                        };

                        if (hasCircuitStateChanged(payload)) {
                            moveQuantumOperation(payload);
                        }
                        break;
                    }
                    default:
                        console.error(`Unknown drag origin: ${String((data as Partial<DragData>).origin)}`);
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
        [
            addQuantumOperation,
            circuit,
            dispatch,
            hasCircuitStateChanged,
            moveQuantumOperation,
            onRequestMeasurementTarget,
            setDraggingOperationId,
            setHoverPos,
        ],
    );

    return (
        <div className="absolute inset-0 z-10">
            {flatQubits.map((qubit, qIdx) =>
                Array.from({ length: uiLayers.length + 1 }).map((_, layerIdx) => {
                    const isZoneActive = activeDropZones.has(`${qIdx}-${layerIdx}`);
                    if (!isZoneActive) return null;

                    if (qubit.regType !== REGISTER_TYPE_QUANTUM) return null;

                    return (
                        <div
                            key={`drop-${qIdx}-${layerIdx}`}
                            style={{
                                position: 'absolute',
                                left: layerIdx * CELL_WIDTH,
                                top: qubit.visualY,
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
