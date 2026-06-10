import { Card, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { ElementSelectorDto, getInvolvedSelectors, getRegisterSize, getSelectorKey } from '@/api/dto/circuit';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store.ts';
import { CircuitToolbar } from './components/CircuitToolbar.tsx';
import { CircuitTabBar } from '@/views/circuit-view/components/CircuitTabBar.tsx';
import { QubitWires } from './components/QubitWires.tsx';
import { QuantumOperationGrid } from './components/QuantumOperationGrid.tsx';
import { DropzoneGrid } from './components/DropzoneGrid.tsx';
import { DropPlaceholder } from './components/DropPlaceholder.tsx';
import { CircuitFooter } from './components/CircuitFooter.tsx';
import { HoverPos, UiLayer, UiQuantumOperation } from './util/types.ts';
import { CELL_WIDTH, LABEL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';

export function CircuitView() {
    const { activeCircuit, setActiveCircuit } = useCircuitTabs();
    const removeQuantumOperation = (operationId: string) => {
        setActiveCircuit((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                layers: prev.layers
                    .map((layer) => ({
                        quantumOperations: layer.quantumOperations.filter((operation) => operation.id !== operationId),
                    }))
                    .filter((layer) => layer.quantumOperations.length > 0),
            };
        });
    };

    const { isOperationDragging, draggingOperationSize } = useSelector((state: RootState) => state.dragOperation);

    const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
    const [draggingOperationId, setDraggingOperationId] = useState<string | null>(null);

    /**
     * Flattens the nested register structure into a single array of qubits
     * for easier rendering of wires and drop zones.
     */
    const flatQubits = useMemo(() => {
        if (!activeCircuit?.registers) return [];

        let globalCounter = 0;
        return activeCircuit.registers.flatMap((reg, regIdx) =>
            Array.from({ length: getRegisterSize(reg) }).map((_, relQubitIdx) => ({
                regId: reg.id,
                regName: reg.name,
                regIdx,
                relQubitIdx, // Index within the register
                absQubitIdx: globalCounter++, // Absolute vertical index
            })),
        );
    }, [activeCircuit?.registers]);

    const getOperationSpan = (op: UiQuantumOperation) => {
        const involvedIndices = getInvolvedSelectors(op).map((selector) => selector.index);
        return {
            min: Math.min(...involvedIndices),
            max: Math.max(...involvedIndices),
        };
    };

    const doOperationSpansOverlap = (a: UiQuantumOperation, b: UiQuantumOperation): boolean => {
        const spanA = getOperationSpan(a);
        const spanB = getOperationSpan(b);

        return spanA.min <= spanB.max && spanB.min <= spanA.max;
    };

    /**
     * Determines whether a quantum operation would visually collide within the
     * specified layer. Besides exact qubit conflicts, multi-qubit gates also
     * reserve the vertical area between their target and control qubits.
     */
    const isQubitCollisionInLayer = (op: UiQuantumOperation, layer: UiLayer): boolean => {
        const requiredKeys = new Set(getInvolvedSelectors(op).map(getSelectorKey));

        return layer.quantumOperations.some((existingOp) => {
            const existingKeys = getInvolvedSelectors(existingOp).map(getSelectorKey);
            return existingKeys.some((key) => requiredKeys.has(key)) || doOperationSpansOverlap(op, existingOp);
        });
    };

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
            while (layerIdx < newLayers.length && isQubitCollisionInLayer(op, newLayers[layerIdx])) {
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
        if (!activeCircuit?.layers) return [];

        const ops = activeCircuit.layers.flatMap((layer, layerIdx) =>
            layer.quantumOperations
                .filter((op) => op.id !== draggingOperationId)
                .map((op) => ({ ...op, originalLayerIdx: layerIdx }) as UiQuantumOperation),
        );

        return rescheduleOperations(ops);
    }, [activeCircuit, draggingOperationId]);

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
        if (!activeCircuit?.registers) return [];

        const allOps: UiQuantumOperation[] = layersWithoutDragOp.flatMap((layer, layerIdx) =>
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
                    identifier: 'DUMMY',
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
    }, [activeCircuit, hoverPos]);

    const operationColumnCount = Math.max(uiLayers.length + 1, 1);
    const operationAreaWidth = operationColumnCount * CELL_WIDTH;
    const circuitWidth = LABEL_WIDTH + operationAreaWidth;
    const circuitHeight = Math.max(flatQubits.length * QUBIT_HEIGHT, QUBIT_HEIGHT);

    return (
        <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
            <CardContent className="flex flex-col h-full p-0">
                <CircuitTabBar />
                <div className="px-6 pt-5">
                    <CircuitToolbar circuit={activeCircuit} setCircuit={setActiveCircuit} />
                </div>

                {/* Circuit Canvas */}
                <div className="relative flex-1 overflow-auto">
                    <div className="relative min-h-full" style={{ width: circuitWidth, height: circuitHeight }}>
                        <QubitWires
                            circuit={activeCircuit}
                            setCircuit={setActiveCircuit}
                            flatQubits={flatQubits}
                            circuitWidth={circuitWidth}
                        />

                        {/* Circuit Content Container (Offset for labels) */}
                        <div className="absolute inset-y-0" style={{ left: LABEL_WIDTH, width: operationAreaWidth }}>
                            <QuantumOperationGrid
                                uiLayers={uiLayers}
                                registers={activeCircuit?.registers ?? []}
                                isOperationDragging={isOperationDragging}
                                removeQuantumOperation={removeQuantumOperation}
                                setDraggingOperationId={setDraggingOperationId}
                                setHoverPos={setHoverPos}
                            />

                            <DropzoneGrid
                                circuit={activeCircuit}
                                setCircuit={setActiveCircuit}
                                flatQubits={flatQubits}
                                uiLayers={uiLayers}
                                activeDropZones={activeDropZones}
                                setHoverPos={setHoverPos}
                                setDraggingOperationId={setDraggingOperationId}
                            />

                            <DropPlaceholder hoverPos={hoverPos} draggingOperationSize={draggingOperationSize} />
                        </div>
                    </div>
                    <CircuitFooter uiLayers={uiLayers} />
                </div>
            </CardContent>
        </Card>
    );
}
