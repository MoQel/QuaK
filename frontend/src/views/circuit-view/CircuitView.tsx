import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '@/App.module.css';
import { api } from '@/api/api';
import {
    AddQuantumOperationRequest,
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    getInvolvedSelectors,
    getRegisterSize,
    getSelectorKey,
    MoveQuantumOperationRequest,
    QuantumOperationDto,
} from '@/api/dto/circuit';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/layout.ts';
import {
    getOperationControlSizeByIdentifier,
    getOperationTargetSizeByIdentifier,
    OperationIdentifier,
} from '@/api/dto/OperationDefinition.ts';
import { ElementaryQuantumGate } from '@/views/circuit-view/ElementaryQuantumGate.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store.ts';
import { startOperationDrag, stopOperationDrag } from '@/store/slices/dragOperationSlice.ts';

interface CircuitViewProps {
    circuit: CircuitResponse | undefined;
    setCircuit: (circuit: CircuitResponse) => void;
}

interface DragData {
    origin: 'library' | 'circuit';
    operationDefinition: OperationIdentifier;
    id?: string;
}

type UiLayer = {
    quantumOperations: UiQuantumOperation[];
};

type UiQuantumOperation = QuantumOperationDto & {
    originalLayerIdx: number;
};

function useCircuitActions(circuit: CircuitResponse | undefined, setCircuit: (circuit: CircuitResponse) => void) {
    const initCircuit = useCallback(() => {
        api.post<CircuitResponse>('/api/circuit').then(setCircuit);
    }, []);

    const addQubit = () => {
        if (!circuit) return;
        const lastReg = circuit.registers.at(-1);
        if (lastReg) {
            api.post<CircuitResponse>(`/api/circuit/${circuit.id}/register/${lastReg.id}`).then(setCircuit);
        }
    };

    const deleteLastQubit = () => {
        if (!circuit) return;
        const lastReg = circuit.registers.at(-1);
        if (lastReg) {
            api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/register/${lastReg.id}`).then(setCircuit);
        }
    };

    const resetCircuit = () => {
        if (!circuit) return;
        api.delete(`/api/circuit/${circuit.id}`).then(initCircuit);
    };

    const addQuantumOperation = (payload: AddQuantumOperationRequest) => {
        if (!circuit) return;
        api.post<CircuitResponse>(`/api/circuit/${circuit.id}/operation`, payload).then(setCircuit);
    };

    const moveQuantumOperation = (payload: MoveQuantumOperationRequest) => {
        if (!circuit) return;
        api.patch<CircuitResponse>(`/api/circuit/${circuit.id}/operation`, payload).then(setCircuit);
    };

    const removeQuantumOperation = (operationId: string) => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/operation/${operationId}`).then(setCircuit);
    };

    return {
        initCircuit,
        addQubit,
        deleteLastQubit,
        resetCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation,
    };
}

export function CircuitView({ circuit, setCircuit }: Readonly<CircuitViewProps>) {
    const {
        initCircuit,
        addQubit,
        deleteLastQubit,
        resetCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation,
    } = useCircuitActions(circuit, setCircuit);

    const dispatch = useDispatch();
    const { isOperationDragging, draggingOperationSize } = useSelector((state: RootState) => state.dragOperation);

    // UI State
    const [hoverPos, setHoverPos] = useState<{ qubitIdx: number; layerIdx: number } | null>(null);
    const [draggingOperationId, setDraggingOperationId] = useState<string | null>(null);

    useEffect(() => initCircuit(), []);

    /**
     * Flattens the nested register structure into a single array of qubits
     * for easier rendering of wires and drop zones.
     */
    const flatQubits = useMemo(() => {
        if (!circuit?.registers) return [];

        let globalCounter = 0;
        return circuit.registers.flatMap((reg, regIdx) =>
            Array.from({ length: getRegisterSize(reg) }).map((_, relQubitIdx) => ({
                regId: reg.id,
                regName: reg.name,
                regIdx,
                relQubitIdx, // Index within the register
                absQubitIdx: globalCounter++, // Absolute vertical index
            })),
        );
    }, [circuit?.registers]);

    /**
     * Applies ASAP (as-soon-as-possible) left-justified scheduling to a flat list of operations.
     * Each operation is placed in the earliest layer where none of its qubits are already occupied.
     * If a dummy operation is present, it is additionally constrained to the layer indicated by the
     * current hover position to reflect the user's intended placement.
     *
     * @param allOps - Flat list of operations, pre-sorted by their original layer index.
     * @returns Reconstructed layer array with no empty layers.
     */
    const rescheduleOperations = (allOps: UiQuantumOperation[]): UiLayer[] => {
        const newLayers: UiLayer[] = [];
        const lastLayerPerQubit = new Map<string, number>();

        const isQubitCollisionInLayer = (op: UiQuantumOperation, layerIdx: number): boolean => {
            if (layerIdx >= newLayers.length) return false;

            const requiredKeys = new Set(getInvolvedSelectors(op).map(getSelectorKey));

            return newLayers[layerIdx].quantumOperations.some((existingOp) => {
                const existingKeys = getInvolvedSelectors(existingOp).map(getSelectorKey);
                return existingKeys.some((key) => requiredKeys.has(key));
            });
        };

        for (const op of allOps) {
            const involvedKeys = getInvolvedSelectors(op).map(getSelectorKey);

            // Find the earliest possible layer based on the last occupied layer per qubit.
            let minLayerIdx = 0;
            for (const key of involvedKeys) {
                minLayerIdx = Math.max(minLayerIdx, lastLayerPerQubit.get(key) ?? -1);
            }

            // The dummy operation must not land further left than the user's current hover position.
            if (op.type === 'DUMMY' && hoverPos) {
                minLayerIdx = Math.max(minLayerIdx, hoverPos.layerIdx);
            }

            // Advance to the right until there is no qubit collision.
            let layerIdx = minLayerIdx;
            while (isQubitCollisionInLayer(op, layerIdx)) {
                layerIdx++;
            }

            while (newLayers.length <= layerIdx) {
                newLayers.push({ quantumOperations: [] });
            }

            newLayers[layerIdx].quantumOperations.push(op);

            for (const key of involvedKeys) {
                lastLayerPerQubit.set(key, layerIdx);
            }
        }

        // Drop empty layers.
        return newLayers.filter((layer) => layer.quantumOperations.length > 0);
    };

    /**
     * Circuit state without the currently dragged operation, used to compute valid drop zones.
     */
    const layersWithoutDragOp = useMemo(() => {
        if (!circuit?.layers) return [];

        const ops = circuit.layers.flatMap((layer, layerIdx) =>
            layer.quantumOperations
                .filter((op) => op.id !== draggingOperationId)
                .map((op) => ({ ...op, originalLayerIdx: layerIdx }) as UiQuantumOperation),
        );

        return rescheduleOperations(ops);
    }, [circuit, draggingOperationId]);

    /**
     * Determines valid drop zones based on circuit adjacency rules.
     * An operation may only be placed in the first layer or directly after
     * a layer that already contains an operation on at least one of the targeted qubits.
     *
     * @returns A set of keys in the format `"qubitIdx-layerIdx"`.
     */
    const activeDropZones = useMemo(() => {
        const activeSet = new Set<string>();

        for (let qubitIdx = 0; qubitIdx < flatQubits.length; qubitIdx++) {
            for (let layerIdx = 0; layerIdx <= layersWithoutDragOp.length; layerIdx++) {
                // Reject placements that would exceed the total number of available qubits.
                if (qubitIdx + draggingOperationSize > flatQubits.length) continue;

                // The first layer is always a valid drop target.
                if (layerIdx === 0) {
                    activeSet.add(`${qubitIdx}-${layerIdx}`);
                    continue;
                }

                // Only allow placement adjacent to an existing operation on an overlapping qubit.
                const hasOperationAtLeft = layersWithoutDragOp[layerIdx - 1]?.quantumOperations
                    .filter((op) => op.type !== 'DUMMY')
                    .some((op) =>
                        [...op.targetQubits, ...op.controlQubits].some(
                            (sel) => qubitIdx <= sel.index && sel.index < qubitIdx + draggingOperationSize,
                        ),
                    );

                if (hasOperationAtLeft) {
                    activeSet.add(`${qubitIdx}-${layerIdx}`);
                }
            }
        }
        return activeSet;
    }, [layersWithoutDragOp, flatQubits, draggingOperationSize]);

    /**
     * Derives the full UI layer representation of the circuit, including a dummy operation
     * at the current hover position during drag interactions.
     *
     * Steps:
     * 1. Extract all operations except the one currently being dragged.
     * 2. Re-schedule them with ASAP ordering to close any gaps left by the removed operation.
     * 3. Inject a dummy operation at the hover position so the user sees a placement preview.
     * 4. Re-sort by original layer index to preserve temporal ordering.
     * 5. Re-run ASAP scheduling on the combined set to produce the final layer layout.
     */
    const uiLayers: UiLayer[] = useMemo(() => {
        if (!circuit?.registers) return [];

        let allOps: UiQuantumOperation[] = circuit.layers.flatMap((layer, layerIdx) =>
            layer.quantumOperations
                .filter((op) => op.id !== draggingOperationId)
                .map((op) => ({ ...op, originalLayerIdx: layerIdx })),
        );

        const organizedCircuitWithoutDraggingOperation = rescheduleOperations(allOps);
        allOps = organizedCircuitWithoutDraggingOperation.flatMap((layer, layerIdx) =>
            layer.quantumOperations.map((op) => ({ ...op, originalLayerIdx: layerIdx })),
        );

        if (hoverPos && activeDropZones.has(`${hoverPos.qubitIdx}-${hoverPos.layerIdx}`)) {
            const hoverQubit = flatQubits[hoverPos.qubitIdx];

            if (hoverQubit) {
                // Build dummy selectors covering all qubits the dummy operation would occupy.
                // This allows the scheduling algorithm to detect collisions correctly.
                const dummySelectors: ElementSelectorDto[] = Array.from({ length: draggingOperationSize }, (_, i) => ({
                    registerId: hoverQubit.regId,
                    index: hoverQubit.relQubitIdx + i,
                }));

                // Prepend the dummy operation so it is prioritized during sorting at equal layer indices.
                allOps.unshift({
                    id: 'dummy',
                    type: 'DUMMY',
                    operationDefinition: 'DUMMY',
                    inverseForm: false,
                    targetQubits: dummySelectors,
                    controlQubits: [],
                    rotationAngle: 0,
                    originalLayerIdx: hoverPos.layerIdx,
                    isDummy: true,
                } as UiQuantumOperation);
            }
        }

        // Preserve temporal ordering before re-scheduling.
        allOps.sort((a, b) => a.originalLayerIdx - b.originalLayerIdx);

        return rescheduleOperations(allOps);
    }, [circuit, hoverPos]);

    /**
     * Compares the current circuit state against the UI layer representation to determine
     * whether any operation has shifted to a different layer or qubit position.
     * Used to avoid sending unnecessary move requests to the API when nothing has changed.
     */
    const hasCircuitStateChanged = useCallback(
        (operationToMove: MoveQuantumOperationRequest): boolean => {
            if (!circuit) return false;

            // Lookup map of the server-side circuit state.
            const originalPositions = new Map<
                string,
                {
                    layerIdx: number;
                    targetQubits: ElementSelectorDto[];
                    controlQubits: ElementSelectorDto[];
                }
            >();

            for (const [layerIdx, layer] of circuit.layers.entries()) {
                for (const op of layer.quantumOperations) {
                    originalPositions.set(op.id!, {
                        layerIdx,
                        targetQubits: op.targetQubits,
                        controlQubits: op.controlQubits,
                    });
                }
            }

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
                    if (op.type === 'DUMMY') continue;

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
                const controlSize = getOperationControlSizeByIdentifier(data.operationDefinition);
                const targetSize = getOperationTargetSizeByIdentifier(data.operationDefinition);

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
                        const gate: ElementaryQuantumGateDto = {
                            type: 'ELEMENTARY_QUANTUM_GATE',
                            operationDefinition: data.operationDefinition,
                            inverseForm: false,
                            targetQubits,
                            controlQubits,
                            rotationAngle: Math.PI / 2, // standard rotation
                        };
                        addQuantumOperation({ quantumOperation: gate, layerIdx });
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

    return (
        <Card className="h-full overflow-hidden">
            <CardContent className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="pb-5 flex justify-end space-x-3">
                    <Button onClick={addQubit} size="icon" className="size-8">
                        <Plus />
                    </Button>
                    <Button onClick={deleteLastQubit} size="icon" className="size-8" variant="destructive">
                        <Minus />
                    </Button>
                    <Button onClick={() => resetCircuit()} size="icon" className="size-8" variant="destructive">
                        <Trash />
                    </Button>
                </div>

                {/* Circuit Canvas */}
                <div className="relative flex-1 overflow-auto">
                    {/* Wires & Labels */}
                    {flatQubits.map((q, i) => (
                        <div
                            key={`wire-${q.regName}-${q.relQubitIdx}`}
                            className="absolute left-0 right-0"
                            style={{ top: i * QUBIT_HEIGHT, height: QUBIT_HEIGHT }}
                        >
                            <div
                                className="absolute left-2 flex items-center font-mono text-[12px]"
                                style={{ height: QUBIT_HEIGHT, width: '60px' }}
                            >
                                {q.regName}[{q.relQubitIdx}]
                            </div>
                            <div
                                className="absolute border-b"
                                style={{
                                    top: QUBIT_HEIGHT / 2,
                                    left: '64px',
                                    right: 0,
                                    height: '1px',
                                }}
                            />
                        </div>
                    ))}

                    {/* Circuit Content Container (Offset for labels) */}
                    <div className="absolute inset-y-0 right-0" style={{ left: '64px' }}>
                        {/* Quantum Operations */}
                        <div className={`absolute inset-0 z-20 ${isOperationDragging ? 'pointer-events-none' : ''}`}>
                            {uiLayers.map((layer, layerIdx) =>
                                layer.quantumOperations.map((op) => {
                                    if (op.type === 'DUMMY') return null;

                                    return (
                                        <ElementaryQuantumGate
                                            key={op.id}
                                            operation={op}
                                            registers={circuit!.registers}
                                            layerIdx={layerIdx}
                                            onDragStart={(operationSize) => {
                                                dispatch(startOperationDrag(operationSize));
                                                setDraggingOperationId(op.id!);
                                            }}
                                            onDragEnd={() => {
                                                dispatch(stopOperationDrag());
                                                setHoverPos(null);
                                                setDraggingOperationId(null);
                                            }}
                                            onDelete={() => removeQuantumOperation(op.id!)}
                                        />
                                    );
                                }),
                            )}
                        </div>

                        {/* 3. Drop Zone Grid */}
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

                        {/* 4. Drop Placeholder (Visual Feedback) */}
                        {hoverPos && (
                            <div
                                className="absolute border-2 border-dashed pointer-events-none z-50 border-primary/50 bg-primary/10"
                                style={{
                                    top: hoverPos.qubitIdx * QUBIT_HEIGHT,
                                    left: hoverPos.layerIdx * CELL_WIDTH,
                                    width: CELL_WIDTH,
                                    height: draggingOperationSize * QUBIT_HEIGHT,
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Gate Layer Indexing (Footer) */}
                <div className={`${styles.gateIndexSpacing} flex font-mono text-sm border-l border-gray-500`}>
                    {Array.from({ length: uiLayers.length }, (_, i) => (
                        <span
                            key={i}
                            className={`${styles.gateIndexSize} text-text shrink-0 flex justify-center border-r border-border`}
                        >
                            {i + 1}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
