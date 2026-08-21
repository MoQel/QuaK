import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CircuitResponse, ElementSelectorDto, getRegisterSize, QuantumOperationDto } from '@/api/dto/circuit';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store.ts';
import { CircuitTabBar } from '@/views/circuit-view/components/CircuitTabBar.tsx';
import { QubitWires } from './components/QubitWires.tsx';
import { QuantumOperationGrid } from './components/QuantumOperationGrid.tsx';
import { DropzoneGrid } from './components/DropzoneGrid.tsx';
import { DropPlaceholder } from './components/DropPlaceholder.tsx';
import { LoopFrames } from './components/LoopFrames.tsx';
import { CircuitFooter } from './components/CircuitFooter.tsx';
import { AngleEditTarget, RotationAngleDialog } from './components/RotationAngleDialog.tsx';
import { LoopBlockDialog, LoopDraft } from './components/LoopBlockDialog.tsx';
import { SelectionBox } from './components/SelectionBox.tsx';
import { HoverPos, UiLayer, UiQuantumOperation } from './util/types.ts';
import { CELL_WIDTH, LABEL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { getOperationSpan as getSpan } from '@/views/circuit-view/util/spans.ts';
import { layOutColumns } from '@/views/circuit-view/util/scheduling.ts';
import { getLoopFrames } from '@/views/circuit-view/util/loopFrames.ts';
import { detachFromLoops, framesAround } from '@/views/circuit-view/util/loopMembership.ts';
import { Cell, operationsInRect, rectBetween } from '@/views/circuit-view/util/selection.ts';
import { ungroupComposite } from '@/views/circuit-view/util/ungroupComposite.ts';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';

/** How far the pointer has to travel before a right-press counts as drawing a rectangle. */
const DRAG_THRESHOLD = 4;

/** A rectangle being dragged out, with what it takes to tell a drag from a click. */
type Selection = {
    from: Cell;
    to: Cell;
    /** Where the press started, in client pixels. */
    origin: { x: number; y: number };
    dragged: boolean;
};

/** Removes the operation with the given id from all layers and drops any layer left empty. */
const dropOperationFromLayers = (layers: CircuitResponse['layers'], operationId: string): CircuitResponse['layers'] =>
    layers
        .map((layer) => ({ quantumOperations: layer.quantumOperations.filter((op) => op.id !== operationId) }))
        .filter((layer) => layer.quantumOperations.length > 0);

export function CircuitView() {
    const { activeCircuit, setActiveCircuit, activeCircuitTabId } = useCircuitTabs();
    const removeQuantumOperation = (operationId: string) => {
        setActiveCircuit((prev) =>
            prev
                ? {
                      ...prev,
                      layers: dropOperationFromLayers(prev.layers, operationId),
                      // A frame may not name an operation the circuit no longer has: the backend
                      // rejects the whole save for it, so a deleted gate has to leave its loops too.
                      loopBlocks: detachFromLoops(prev.loopBlocks ?? [], operationId),
                  }
                : prev,
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

    /** The rotation gate whose angle is being edited, or null while the dialog is closed. */
    const [angleTarget, setAngleTarget] = useState<AngleEditTarget | null>(null);

    /** The rectangle currently being dragged out over the circuit, in grid cells. */
    const [selection, setSelection] = useState<Selection | null>(null);

    /**
     * The same value, updated synchronously.
     *
     * The pointer handlers have to see what the previous one just set: state updates land on the
     * next render, so a press and release close together would leave the release looking at `null`
     * and quietly drop the selection. The state copy is only there to draw the rectangle.
     */
    const selectionRef = useRef<Selection | null>(null);

    const updateSelection = (next: Selection | null) => {
        selectionRef.current = next;
        setSelection(next);
    };

    /** Operations chosen for a new frame, waiting for the repeat count. */
    const [loopDraft, setLoopDraft] = useState<LoopDraft | null>(null);

    /** The operation area, so pointer positions can be turned into grid cells. */
    const operationAreaRef = useRef<HTMLDivElement>(null);

    const editRotationAngle = (operation: QuantumOperationDto) => {
        if (operation.type !== 'ELEMENTARY_QUANTUM_GATE' || !operation.id) return;
        setAngleTarget({
            operationId: operation.id,
            identifier: String(operation.identifier),
            angle: operation.rotationAngle,
        });
    };

    /**
     * Writes a new angle onto one gate.
     *
     * Goes through `setActiveCircuit` like every other circuit edit, so the debounced full-replace
     * save picks it up — there is deliberately no granular endpoint for a single operation.
     */
    const setRotationAngle = (operationId: string, rotationAngle: number) => {
        setActiveCircuit((prev) =>
            prev
                ? {
                      ...prev,
                      layers: prev.layers.map((layer) => ({
                          quantumOperations: layer.quantumOperations.map((op) =>
                              op.id === operationId && op.type === 'ELEMENTARY_QUANTUM_GATE'
                                  ? { ...op, rotationAngle }
                                  : op,
                          ),
                      })),
                  }
                : prev,
        );
    };

    /** Adds a repetition frame over already chosen operations. */
    const addLoopBlock = (operationIds: string[], repeatCount: number) => {
        setActiveCircuit((prev) =>
            prev
                ? {
                      ...prev,
                      loopBlocks: [...(prev.loopBlocks ?? []), { id: crypto.randomUUID(), repeatCount, operationIds }],
                  }
                : prev,
        );
    };

    const { isOperationDragging, draggingOperationSize, draggingGrabOffset } = useSelector(
        (state: RootState) => state.dragOperation,
    );

    const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
    const [draggingOperationId, setDraggingOperationId] = useState<string | null>(null);

    // The placeholder is cleared on drop and on leaving a cell, but a drag can also end without
    // either: pressing Escape, or releasing over a cell that declines the drop (which omits
    // preventDefault and so never fires one). The dashed rectangle then stayed on the canvas until
    // the next drag.
    useEffect(() => {
        if (!isOperationDragging) setHoverPos(null);
    }, [isOperationDragging]);

    // Belt and braces, because the line above depends on the drag source dispatching
    // stopOperationDrag from its own dragend — and dragend does not fire at all when that element
    // leaves the DOM mid-drag, which is exactly the trap the operation grid keeps its ghost mounted
    // for. These listeners sit on the window, so they run whatever the source did or did not do.
    useEffect(() => {
        const clear = () => setHoverPos(null);
        window.addEventListener('dragend', clear);
        window.addEventListener('drop', clear);
        return () => {
            window.removeEventListener('dragend', clear);
            window.removeEventListener('drop', clear);
        };
    }, []);

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
    const rescheduleOperations = (allOps: UiQuantumOperation[], blocks = activeCircuit?.loopBlocks ?? []): UiLayer[] =>
        layOutColumns(allOps, blocks, {
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
     * The frames as they are while the dragged operation is out of the circuit.
     *
     * This — not the rendered `loopFrames` — is what a drop is judged against. The rendered ones
     * include the placeholder, which pushes a frame aside as it moves, so they shift under the very
     * pointer that is aiming at them.
     */
    const stableFrames = useMemo(
        () => getLoopFrames(layersWithoutDragOp, activeCircuit?.loopBlocks ?? [], activeCircuit?.registers ?? []),
        [layersWithoutDragOp, activeCircuit?.loopBlocks, activeCircuit?.registers],
    );

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

                const dropSpanMax = qubitIdx + draggingOperationSize - 1;

                // Anywhere inside a repetition frame is reachable, adjacency or not. The rule below
                // exists because ASAP scheduling pulls a gate left until something stops it, so a
                // position with nothing to its left is not a position at all — but a frame's
                // rectangle *is* reserved, so a cell in it holds. Without this a gate could only be
                // dragged into a loop on wires that happen to be occupied to the left, which is why
                // dropping one into a frame felt arbitrary.
                if (framesAround(stableFrames, layerIdx, { min: qubitIdx, max: dropSpanMax }).length > 0) {
                    activeSet.add(`${qubitIdx}-${layerIdx}`);
                    continue;
                }

                // Otherwise only allow placement adjacent to an existing operation whose SPAN
                // overlaps the dropped span — the same span-overlap rule the collision check and the
                // scheduler use. Checking only target/control selectors is too narrow: e.g.
                // an H on q1 next to a ccx q[0],q[2],q[3] is a stable position (the CCX span
                // blocks column 0) although q1 carries no selector of the CCX; the parser can
                // produce such layouts, so dragging must be able to reach them too.
                const hasOperationAtLeft = layersWithoutDragOp[layerIdx - 1]?.quantumOperations
                    .filter((op) => op.type !== 'DUMMY')
                    .some((op) => {
                        const span = getOperationSpan(op);
                        return span.min <= dropSpanMax && qubitIdx <= span.max;
                    });

                // A frame to the left holds a gate just as an operation does: its rectangle is
                // reserved against non-members, so the gate cannot slide past it and the cell is a
                // stable position. Without this, a wire the frame covers but has no gate on in its
                // last column — the gap inside a loop — made every cell to the right of the frame
                // unreachable on that wire, so a gate could not be dragged alongside a loop at all.
                const frameAtLeft = stableFrames.some(
                    (frame) =>
                        frame.firstColumn <= layerIdx - 1 &&
                        layerIdx - 1 <= frame.lastColumn &&
                        frame.topWire <= dropSpanMax &&
                        qubitIdx <= frame.bottomWire,
                );

                if (hasOperationAtLeft || frameAtLeft) {
                    activeSet.add(`${qubitIdx}-${layerIdx}`);
                }
            }
        }
        return activeSet;
    }, [layersWithoutDragOp, flatQubits, draggingOperationSize, stableFrames]);

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

        // A frame's rectangle is reserved against everything that is not a member, so a placeholder
        // hovering inside one would be pushed straight back out and the preview could never show a
        // gate joining a loop. Letting the placeholder count as a member for the preview is what
        // makes the frame grow around it instead — and it matches what the drop will then do.
        const previewBlocks = hoverPos
            ? (activeCircuit?.loopBlocks ?? []).map((block) =>
                  framesAround(stableFrames, hoverPos.layerIdx, {
                      min: hoverPos.qubitIdx,
                      max: hoverPos.qubitIdx + draggingOperationSize - 1,
                  }).some((frame) => frame.id === block.id)
                      ? { ...block, operationIds: [...block.operationIds, 'dummy'] }
                      : block,
              )
            : (activeCircuit?.loopBlocks ?? []);

        return rescheduleOperations(allOps, previewBlocks);
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

    /** The cell under a pointer position, clamped to the grid. */
    const cellAt = (clientX: number, clientY: number): Cell => {
        const bounds = operationAreaRef.current!.getBoundingClientRect();
        const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));

        return {
            column: clamp(Math.floor((clientX - bounds.left) / CELL_WIDTH), uiLayers.length),
            wire: clamp(Math.floor((clientY - bounds.top) / QUBIT_HEIGHT), flatQubits.length - 1),
        };
    };

    /** Whether a pointer event landed on a gate rather than on empty canvas. */
    const isOnGate = (event: React.PointerEvent | React.MouseEvent) =>
        (event.target as Element).closest('[data-gate]') !== null;

    /**
     * Starts dragging out a selection — on the **right** button, and only on empty canvas.
     *
     * Drawing a loop is a deliberate act and has to be asked for: on the left button every stray
     * click in the circuit tore open a rectangle and popped up the repeat dialog, which got in the
     * way of everything else. The right button is free here — a gate's own context menu keeps it,
     * which is why a pointer landing on a gate is left alone.
     */
    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 2 || isOnGate(event)) return;

        // Capturing means the rest of the drag arrives here even when the pointer leaves the canvas,
        // so releasing outside cannot leave a selection stuck open.
        event.currentTarget.setPointerCapture(event.pointerId);
        const cell = cellAt(event.clientX, event.clientY);
        updateSelection({ from: cell, to: cell, origin: { x: event.clientX, y: event.clientY }, dragged: false });
    };

    /**
     * Keeps the browser's own menu out of the way of a right-drag on empty canvas — but only there,
     * so right-clicking a gate still opens its menu (remove loop, change angle, ungroup).
     */
    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isOnGate(event)) event.preventDefault();
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const current = selectionRef.current;
        if (!current) return;

        const travelled =
            Math.abs(event.clientX - current.origin.x) + Math.abs(event.clientY - current.origin.y) > DRAG_THRESHOLD;

        updateSelection({
            ...current,
            to: cellAt(event.clientX, event.clientY),
            dragged: current.dragged || travelled,
        });
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const current = selectionRef.current;
        if (!current) return;
        event.currentTarget.releasePointerCapture(event.pointerId);

        const covered = operationsInRect(
            uiLayers,
            activeCircuit?.registers ?? [],
            rectBetween(current.from, current.to),
        );
        updateSelection(null);

        // A plain click is not a selection. Gates inside a frame are drawn smaller, so aiming at one
        // and missing by a few pixels is easy — and putting a dialog in the way of that miss is how
        // the frame's own context menu became unreachable.
        if (!current.dragged) return;

        // An empty rectangle is how the user cancels: nothing selected, nothing to ask about.
        if (covered.length > 0) {
            setLoopDraft({ id: crypto.randomUUID(), operationIds: covered.map((operation) => operation.id!) });
        }
    };

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
                        <div
                            ref={operationAreaRef}
                            className="absolute inset-y-0"
                            style={{ left: LABEL_WIDTH, width: operationAreaWidth }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onContextMenu={handleContextMenu}
                        >
                            <QuantumOperationGrid
                                uiLayers={uiLayers}
                                registers={activeCircuit?.registers ?? []}
                                isOperationDragging={isOperationDragging}
                                loopBlocks={activeCircuit?.loopBlocks ?? []}
                                removeQuantumOperation={removeQuantumOperation}
                                removeLoopBlock={removeLoopBlock}
                                ungroupQuantumOperation={ungroupQuantumOperation}
                                editRotationAngle={editRotationAngle}
                                setDraggingOperationId={setDraggingOperationId}
                                setHoverPos={setHoverPos}
                                draggingOperation={draggingOperation}
                            />

                            <DropzoneGrid
                                circuit={activeCircuit}
                                setCircuit={setActiveCircuit}
                                flatQubits={flatQubits}
                                uiLayers={uiLayers}
                                loopFrames={stableFrames}
                                activeDropZones={activeDropZones}
                                draggingOperationSize={draggingOperationSize}
                                draggingGrabOffset={draggingGrabOffset}
                                setHoverPos={setHoverPos}
                                setDraggingOperationId={setDraggingOperationId}
                            />

                            <LoopFrames frames={loopFrames} />

                            <DropPlaceholder hoverPos={hoverPos} draggingOperationSize={draggingOperationSize} />

                            {selection && <SelectionBox rect={rectBetween(selection.from, selection.to)} />}
                        </div>
                    </div>
                    <CircuitFooter uiLayers={uiLayers} circuitWidth={circuitWidth} />
                </div>

                {/* Outside the scrolling canvas: it is a modal, not part of the circuit. */}
                <RotationAngleDialog
                    target={angleTarget}
                    onSubmit={setRotationAngle}
                    onClose={() => setAngleTarget(null)}
                />

                <LoopBlockDialog draft={loopDraft} onSubmit={addLoopBlock} onClose={() => setLoopDraft(null)} />
            </CardContent>
        </Card>
    );
}
