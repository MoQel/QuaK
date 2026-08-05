import { Card, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { CircuitResponse, ElementSelectorDto, getRegisterSize } from '@/api/dto/circuit';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store.ts';
import { CircuitTabBar } from '@/views/circuit-view/components/CircuitTabBar.tsx';
import { QubitWires } from './components/QubitWires.tsx';
import { QuantumOperationGrid } from './components/QuantumOperationGrid.tsx';
import { DropzoneGrid } from './components/DropzoneGrid.tsx';
import { DropPlaceholder } from './components/DropPlaceholder.tsx';
import { LoopFrames } from './components/LoopFrames.tsx';
import { CircuitFooter } from './components/CircuitFooter.tsx';
import { HoverPos, UiLayer, UiQuantumOperation } from './util/types.ts';
import { CELL_WIDTH, LABEL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { getOperationSpan as getSpan } from '@/views/circuit-view/util/spans.ts';
import { layOutColumns } from '@/views/circuit-view/util/scheduling.ts';
import { getLoopFrames } from '@/views/circuit-view/util/loopFrames.ts';
import { ungroupComposite } from '@/views/circuit-view/util/ungroupComposite.ts';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';

/** Removes the operation with the given id from all layers and drops any layer left empty. */
const dropOperationFromLayers = (layers: CircuitResponse['layers'], operationId: string): CircuitResponse['layers'] =>
    layers
        .map((layer) => ({ quantumOperations: layer.quantumOperations.filter((op) => op.id !== operationId) }))
        .filter((layer) => layer.quantumOperations.length > 0);

export function CircuitView() {
    const { activeCircuit, setActiveCircuit, activeCircuitTabId } = useCircuitTabs();
    const removeQuantumOperation = (operationId: string) => {
        setActiveCircuit((prev) =>
            prev ? { ...prev, layers: dropOperationFromLayers(prev.layers, operationId) } : prev,
        );
    };

    /** Dissolves a composite gate into the operations it is made of, one level deep. */
    const ungroupQuantumOperation = (operationId: string) => {
        setActiveCircuit((prev) => (prev ? ungroupComposite(prev, operationId) : prev));
    };

    /**
     * Drops a repetition frame, leaving the gates it covered in place.
     *
     * The body then runs once instead of n times, so this changes what the circuit computes — it is
     * the deliberate counterpart to the frame being only an annotation, not a container.
     */
    const removeLoopBlock = (loopBlockId: string) => {
        setActiveCircuit((prev) =>
            prev ? { ...prev, loopBlocks: (prev.loopBlocks ?? []).filter((block) => block.id !== loopBlockId) } : prev,
        );
    };

    const { isOperationDragging, draggingOperationSize, draggingGrabOffset } = useSelector(
        (state: RootState) => state.dragOperation,
    );

    const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
    const [draggingOperationId, setDraggingOperationId] = useState<string | null>(null);

    /**
     * The operation currently being dragged, with its original layer position.
     * Rendered as a ghost so its DOM element (the drag source) stays mounted —
     * otherwise the browser may never fire dragend and the drag state gets stuck
     * when dropping outside a valid drop zone.
     */
    const draggingOperation = useMemo(() => {
        if (!draggingOperationId || !activeCircuit) return null;
        for (const [layerIdx, layer] of activeCircuit.layers.entries()) {
            const op = layer.quantumOperations.find((operation) => operation.id === draggingOperationId);
            if (op) return { op, layerIdx };
        }
        return null;
    }, [draggingOperationId, activeCircuit]);

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

    const getOperationSpan = (op: UiQuantumOperation) => getSpan(activeCircuit?.registers ?? [], op);

    /**
     * Canonical operation order for the ASAP scheduler: by original layer, the
     * dummy operation first (placement priority), then by topmost involved qubit.
     * This keeps the rendered layout stable across parse/generate round trips,
     * independent of the operation order stored in the layers.
     */
    const compareCanonicalOrder = (a: UiQuantumOperation, b: UiQuantumOperation): number => {
        if (a.originalLayerIdx !== b.originalLayerIdx) return a.originalLayerIdx - b.originalLayerIdx;

        const aIsDummy = a.type === 'DUMMY';
        const bIsDummy = b.type === 'DUMMY';
        if (aIsDummy !== bIsDummy) return aIsDummy ? -1 : 1;

        return getOperationSpan(a).min - getOperationSpan(b).min;
    };

    /**
     * Applies ASAP (as-soon-as-possible) left-justified scheduling to a flat list of operations,
     * keeping every repetition frame's rectangle to itself (see `util/scheduling.ts`).
     * If a dummy operation is present, it is additionally constrained to the layer indicated by the
     * current hover position to reflect the user's intended placement.
     *
     * @param allOps - Flat list of operations, pre-sorted by their original layer index.
     * @returns Reconstructed layer array with no empty layers.
     */
    const rescheduleOperations = (allOps: UiQuantumOperation[]): UiLayer[] =>
        layOutColumns(allOps, activeCircuit?.loopBlocks ?? [], {
            spanOf: getOperationSpan,
            minColumnFor: (op: UiQuantumOperation) => (op.type === 'DUMMY' && hoverPos ? hoverPos.layerIdx : 0),
        });

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
        ops.sort(compareCanonicalOrder);

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

                // Only allow placement adjacent to an existing operation whose SPAN overlaps
                // the dropped span — the same span-overlap rule the collision check and the
                // scheduler use. Checking only target/control selectors is too narrow: e.g.
                // an H on q1 next to a ccx q[0],q[2],q[3] is a stable position (the CCX span
                // blocks column 0) although q1 carries no selector of the CCX; the parser can
                // produce such layouts, so dragging must be able to reach them too.
                const dropSpanMax = qubitIdx + draggingOperationSize - 1;
                const hasOperationAtLeft = layersWithoutDragOp[layerIdx - 1]?.quantumOperations
                    .filter((op) => op.type !== 'DUMMY')
                    .some((op) => {
                        const span = getOperationSpan(op);
                        return span.min <= dropSpanMax && qubitIdx <= span.max;
                    });

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

        // Preserve temporal ordering before re-scheduling, with canonical
        // tie-breaking so the layout stays stable across round trips.
        allOps.sort(compareCanonicalOrder);

        return rescheduleOperations(allOps);
        // layersWithoutDragOp must be a dependency: it changes with draggingOperationId,
        // and a stale list here keeps the dragged operation filtered out after dragend
        // (gate stays invisible until some other state change).
    }, [activeCircuit, hoverPos, layersWithoutDragOp, activeDropZones, flatQubits, draggingOperationSize]);

    /** Repetition frames, derived from where their members ended up after scheduling. */
    const loopFrames = useMemo(
        () => getLoopFrames(uiLayers, activeCircuit?.loopBlocks ?? [], activeCircuit?.registers ?? []),
        [uiLayers, activeCircuit?.loopBlocks, activeCircuit?.registers],
    );

    const operationColumnCount = Math.max(uiLayers.length + 1, 1);
    const operationAreaWidth = operationColumnCount * CELL_WIDTH;
    const circuitWidth = LABEL_WIDTH + operationAreaWidth;
    const circuitHeight = Math.max(flatQubits.length * QUBIT_HEIGHT, QUBIT_HEIGHT);

    // Circuits exist per file only, so without an active file tab there is nothing
    // to show. Mirror the Code Editor's "No file open" state.
    if (!activeCircuitTabId) {
        return (
            <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
                <CardContent className="flex h-full items-center justify-center p-0 text-gray-500">
                    No file open
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
            <CardContent className="flex flex-col h-full p-0">
                <CircuitTabBar />

                {/* Circuit Canvas */}
                <div className="relative flex-1 overflow-auto flex flex-col [&::-webkit-scrollbar-track]:bg-bg-subtle">
                    <div
                        className="relative flex-1 shrink-0 isolate"
                        style={{ width: circuitWidth, minHeight: circuitHeight }}
                    >
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
                                loopBlocks={activeCircuit?.loopBlocks ?? []}
                                removeQuantumOperation={removeQuantumOperation}
                                removeLoopBlock={removeLoopBlock}
                                ungroupQuantumOperation={ungroupQuantumOperation}
                                setDraggingOperationId={setDraggingOperationId}
                                setHoverPos={setHoverPos}
                                draggingOperation={draggingOperation}
                            />

                            <DropzoneGrid
                                circuit={activeCircuit}
                                setCircuit={setActiveCircuit}
                                flatQubits={flatQubits}
                                uiLayers={uiLayers}
                                activeDropZones={activeDropZones}
                                draggingOperationSize={draggingOperationSize}
                                draggingGrabOffset={draggingGrabOffset}
                                setHoverPos={setHoverPos}
                                setDraggingOperationId={setDraggingOperationId}
                            />

                            <LoopFrames frames={loopFrames} />

                            <DropPlaceholder hoverPos={hoverPos} draggingOperationSize={draggingOperationSize} />
                        </div>
                    </div>
                    <CircuitFooter uiLayers={uiLayers} circuitWidth={circuitWidth} />
                </div>
            </CardContent>
        </Card>
    );
}
