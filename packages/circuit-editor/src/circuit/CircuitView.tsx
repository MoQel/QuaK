import { Card, CardContent } from '@quak/ui/card';
import { Button } from '@quak/ui/button';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
    type CircuitResponse,
    ElementSelectorDto,
    getInvolvedSelectors,
    getRegisterSize,
    getSelectorKey,
    type QuantumOperationDto,
    isClassicRegister,
    isQuantumRegister,
    isSubcircuit,
    MeasurementDto,
    SubcircuitOperationDto,
    type LoopBlockDto,
    type RegisterResponse,
    REGISTER_TYPE_QUANTUM,
    type SubcircuitOption,
    getLoopFrames,
} from '@quak/circuit-core';
import { QubitMappingItem, SubcircuitQubitMappingDialog } from './components/SubcircuitQubitMappingDialog.tsx';
import { QubitWires } from './components/QubitWires.tsx';
import { QuantumOperationGrid } from './components/QuantumOperationGrid.tsx';
import { DropzoneGrid } from './components/DropzoneGrid.tsx';
import { DropPlaceholder } from './components/DropPlaceholder.tsx';
import { CircuitFooter } from './components/CircuitFooter.tsx';
import type { FlatQubit, HoverPos, UiLayer, UiQuantumOperation } from './util/types.ts';
import { layOutColumns, withTerminalMeasurementsLast } from './util/scheduling.ts';
import { framesAround } from './util/loopMembership.ts';
import { Cell, operationsInRect, rectBetween } from './util/selection.ts';
import { LoopFrames } from './components/LoopFrames.tsx';
import { LoopBlockDialog, LoopDraft } from './components/LoopBlockDialog.tsx';
import { SelectionBox } from './components/SelectionBox.tsx';
import { AngleEditTarget, RotationAngleDialog } from './components/RotationAngleDialog.tsx';
import { createCircuitMutations } from '../circuitMutations.ts';
import { ungroupComposite } from './util/ungroupComposite.ts';
import { unrollLoop } from './util/unrollLoop.ts';
import { groupIntoComposite } from './util/groupIntoComposite.ts';
import { GroupCompositeDialog } from './components/GroupCompositeDialog.tsx';
import { MeasurementTargetDialog } from './components/MeasurementTargetDialog.tsx';
import { CELL_WIDTH, LABEL_WIDTH, QUBIT_HEIGHT } from './util/layout.ts';
import type { OperationIdentifier } from '../operations.ts';
import { useCircuitStore } from '../CircuitStoreContext.tsx';
import { useCircuitDrag } from '../CircuitDragContext.tsx';
import { useCircuitCapabilities } from '../CircuitCapabilitiesContext.tsx';
import { openRegisterManager } from './components/RegisterManager.tsx';

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

interface CircuitViewProps {
    /**
     * Slot above the canvas, for chrome only the host has: the web IDE puts its
     * file-tab bar here, the extension (one document, one circuit) passes nothing.
     */
    header?: ReactNode;
    subcircuits?: SubcircuitOption[];
}

export function CircuitView({ header, subcircuits: availableSubcircuits = [] }: Readonly<CircuitViewProps>) {
    const { circuit, setCircuit } = useCircuitStore();
    const { removeQuantumOperation, addQuantumOperation } = createCircuitMutations(circuit, setCircuit);
    const {
        classicalRegisters: canUseClassicalRegisters,
        compositeGates: canUseCompositeGates,
        loops: canUseLoops,
    } = useCircuitCapabilities();

    /** Replaces a composite gate by the operations it is made of; offered on right-click. */
    const ungroupQuantumOperation = (operationId: string) => {
        setCircuit((prev) => (prev ? ungroupComposite(prev, operationId) : prev));
    };

    /**
     * Drops a repetition frame, leaving the gates it covered in place.
     *
     * The body then runs once instead of n times, so this changes what the circuit computes — it is
     * the deliberate counterpart to the frame being only an annotation, not a container.
     */
    const removeLoopBlock = (loopBlockId: string) => {
        setCircuit((prev) =>
            prev ? { ...prev, loopBlocks: (prev.loopBlocks ?? []).filter((block) => block.id !== loopBlockId) } : prev,
        );
    };

    /**
     * Writes a repetition frame out in full, so every pass stands in the circuit as its own gates.
     *
     * Unlike removing a frame this keeps what the circuit computes; it is the way to open a loop up
     * when only one of its rounds is supposed to differ.
     */
    const unrollLoopBlock = (loopBlockId: string) => {
        setCircuit((prev) => (prev ? unrollLoop(prev, loopBlockId) : prev));
    };

    /** The rotation gate whose angle is being edited, or null while the dialog is closed. */
    const [angleTarget, setAngleTarget] = useState<AngleEditTarget | null>(null);

    interface SubcircuitMappingContext {
        subcircuitName: string;
        subcircuitCircuitId: string;
        subcircuitQubitCount: number;
        layerIdx?: number;
        existingOperationId?: string;
        initialMapping?: QubitMappingItem[];
    }
    const [subcircuitMappingContext, setSubcircuitMappingContext] = useState<SubcircuitMappingContext | null>(null);

    const handleEditSubcircuit = (op: SubcircuitOperationDto) => {
        const option = availableSubcircuits.find((o) => o.circuitId === op.definitionCircuitId);
        const subcircuitQubitCount =
            option?.qubitCount ?? Math.max(...(op.subcircuitQubitIndices ?? []), op.targetQubits.length);
        const initialMapping: QubitMappingItem[] = op.targetQubits.map((targetQubit, idx) => ({
            subcircuitIndex: op.subcircuitQubitIndices ? op.subcircuitQubitIndices[idx] : idx,
            targetQubit,
        }));
        setSubcircuitMappingContext({
            subcircuitName: op.definitionName ?? option?.name ?? 'Subcircuit',
            subcircuitCircuitId: op.definitionCircuitId,
            subcircuitQubitCount,
            existingOperationId: op.id,
            initialMapping,
        });
    };

    const handleRequestSubcircuitMapping = (ctx: { subcircuit: SubcircuitOption; layerIdx: number }) => {
        setSubcircuitMappingContext({
            subcircuitName: ctx.subcircuit.name,
            subcircuitCircuitId: ctx.subcircuit.circuitId,
            subcircuitQubitCount: ctx.subcircuit.qubitCount,
            layerIdx: ctx.layerIdx,
            initialMapping: [],
        });
    };

    const handleSubcircuitMappingSubmit = (mapping: QubitMappingItem[]) => {
        if (!subcircuitMappingContext) return;
        const targetQubits = mapping.map((m) => m.targetQubit);
        const subcircuitQubitIndices = mapping.map((m) => m.subcircuitIndex);

        if (subcircuitMappingContext.existingOperationId) {
            setCircuit((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    layers: prev.layers.map((layer) => ({
                        quantumOperations: layer.quantumOperations.map((operation) => {
                            if (
                                operation.id === subcircuitMappingContext.existingOperationId &&
                                isSubcircuit(operation)
                            ) {
                                return {
                                    ...operation,
                                    targetQubits,
                                    subcircuitQubitIndices,
                                    body: undefined,
                                    bindingError: undefined,
                                };
                            }
                            return operation;
                        }),
                    })),
                };
            });
        } else {
            const operation: SubcircuitOperationDto = {
                id: crypto.randomUUID(),
                type: 'SUBCIRCUIT_OPERATION',
                identifier: subcircuitMappingContext.subcircuitName,
                inverseForm: false,
                definitionCircuitId: subcircuitMappingContext.subcircuitCircuitId,
                definitionName: subcircuitMappingContext.subcircuitName,
                targetQubits,
                controlQubits: [],
                subcircuitQubitIndices,
            };
            addQuantumOperation({ quantumOperation: operation, layerIdx: subcircuitMappingContext.layerIdx ?? 0 });
        }
        setSubcircuitMappingContext(null);
    };

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

    /** Currently selected operation IDs for multi-select, grouping, or looping. */
    const [selectedOperationIds, setSelectedOperationIds] = useState<string[]>([]);
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [operationsToGroup, setOperationsToGroup] = useState<string[]>([]);

    const handleToggleSelect = (operationId: string) => {
        setSelectedOperationIds((prev) =>
            prev.includes(operationId) ? prev.filter((id) => id !== operationId) : [...prev, operationId],
        );
    };

    const handleAddLoop = (operationId: string) => {
        const ids = selectedOperationIds.includes(operationId) ? selectedOperationIds : [operationId];
        setLoopDraft({
            id: crypto.randomUUID(),
            operationIds: ids,
            initialRepeatCount: 2,
            isEditing: false,
        });
    };

    const handleEditLoop = (enclosingLoop: LoopBlockDto) => {
        setLoopDraft({
            id: crypto.randomUUID(),
            operationIds: enclosingLoop.operationIds,
            initialRepeatCount: enclosingLoop.repeatCount,
            isEditing: true,
            loopBlockId: enclosingLoop.id,
        });
    };

    const handleLoopSubmit = (operationIds: string[], repeatCount: number, loopBlockId?: string) => {
        if (loopBlockId) {
            setCircuit((prev) =>
                prev
                    ? {
                          ...prev,
                          loopBlocks: (prev.loopBlocks ?? []).map((block) =>
                              block.id === loopBlockId ? { ...block, repeatCount } : block,
                          ),
                      }
                    : prev,
            );
        } else {
            addLoopBlock(operationIds, repeatCount);
        }
        setSelectedOperationIds([]);
    };

    const handleGroupSelected = (operationId: string) => {
        const ids = selectedOperationIds.includes(operationId) ? selectedOperationIds : [operationId];
        setOperationsToGroup(ids);
        setIsGroupDialogOpen(true);
    };

    const handleGroupSubmit = (gateName: string) => {
        if (!circuit || operationsToGroup.length === 0) return;
        setCircuit((prev) => (prev ? groupIntoComposite(prev, operationsToGroup, gateName, flatQubits) : prev));
        setSelectedOperationIds([]);
    };

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
        setCircuit((prev) =>
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
        setCircuit((prev) =>
            prev
                ? {
                      ...prev,
                      loopBlocks: [...(prev.loopBlocks ?? []), { id: crypto.randomUUID(), repeatCount, operationIds }],
                  }
                : prev,
        );
    };

    const { isOperationDragging, draggingOperationSize, draggingGrabOffset } = useCircuitDrag();

    const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);

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

    const [draggingOperationId, setDraggingOperationId] = useState<string | null>(null);
    const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
    const [expandedClassicRegisterIds, setExpandedClassicRegisterIds] = useState<Set<string>>(() => new Set());
    const [measurementContext, setMeasurementContext] = useState<{
        layerIdx: number;
        targetQubits: ElementSelectorDto[];
        controlQubits: ElementSelectorDto[];
        operationIdentifier: OperationIdentifier;
    } | null>(null);

    const displayRegisters = useMemo(() => {
        if (!circuit?.registers) return [];

        const quantumRegisters = circuit.registers.filter(isQuantumRegister);
        const classicRegisters = circuit.registers.filter(isClassicRegister);

        return [...quantumRegisters, ...classicRegisters];
    }, [circuit?.registers]);

    const collapsedClassicRegisterIds = useMemo(() => {
        return new Set(
            displayRegisters
                .filter(isClassicRegister)
                .filter((register) => !expandedClassicRegisterIds.has(register.id))
                .map((register) => register.id),
        );
    }, [displayRegisters, expandedClassicRegisterIds]);

    const flatQubits = useMemo(() => {
        return buildFlatQubits(displayRegisters, collapsedClassicRegisterIds);
    }, [displayRegisters, collapsedClassicRegisterIds]);

    const selectorRowIndex = useMemo(() => buildSelectorRowIndex(flatQubits), [flatQubits]);

    const draggingOperation = useMemo(() => {
        if (!draggingOperationId || !circuit) return null;
        for (const [layerIdx, layer] of circuit.layers.entries()) {
            const op = layer.quantumOperations.find((operation) => operation.id === draggingOperationId);
            if (op) return { op, layerIdx };
        }
        return null;
    }, [draggingOperationId, circuit]);

    const layersWithoutDragOp = useMemo(() => {
        return buildLayersWithoutDragOp(circuit, draggingOperationId, selectorRowIndex);
    }, [circuit, draggingOperationId, selectorRowIndex]);

    const activeDropZones = useMemo(() => {
        return buildActiveDropZones(flatQubits, layersWithoutDragOp, draggingOperationSize, selectorRowIndex);
    }, [layersWithoutDragOp, flatQubits, draggingOperationSize, selectorRowIndex]);

    /**
     * The frames as they are while the dragged operation is out of the circuit.
     *
     * This -- not the rendered `loopFrames` -- is what a drop is judged against. The rendered ones
     * include the placeholder, which pushes a frame aside as it moves, so they shift under the very
     * pointer that is aiming at them.
     */
    const stableFrames = useMemo(
        () => getLoopFrames(layersWithoutDragOp, circuit?.loopBlocks ?? [], displayRegisters),
        [layersWithoutDragOp, circuit?.loopBlocks, displayRegisters],
    );

    const uiLayers = useMemo(() => {
        // A frame's rectangle is reserved against everything that is not a member, so a placeholder
        // hovering inside one would be pushed straight back out and the preview could never show a
        // gate joining a loop. Letting the placeholder count as a member for the preview is what
        // makes the frame grow around it instead -- and it matches what the drop will then do.
        const previewBlocks = hoverPos
            ? (circuit?.loopBlocks ?? []).map((block) =>
                  framesAround(stableFrames, hoverPos.layerIdx, {
                      min: hoverPos.qubitIdx,
                      max: hoverPos.qubitIdx + draggingOperationSize - 1,
                  }).some((frame) => frame.id === block.id)
                      ? { ...block, operationIds: [...block.operationIds, 'dummy'] }
                      : block,
              )
            : (circuit?.loopBlocks ?? []);

        return buildUiLayers({
            activeDropZones,
            displayRegisters,
            draggingOperationSize,
            flatQubits,
            hoverPos,
            layersWithoutDragOp,
            loopBlocks: previewBlocks,
            selectorRowIndex,
        });
    }, [
        circuit?.loopBlocks,
        displayRegisters,
        hoverPos,
        layersWithoutDragOp,
        activeDropZones,
        flatQubits,
        draggingOperationSize,
        selectorRowIndex,
        stableFrames,
    ]);

    /** Repetition frames, derived from where their members ended up after scheduling. */
    const loopFrames = useMemo(
        () => getLoopFrames(uiLayers, circuit?.loopBlocks ?? [], displayRegisters),
        [uiLayers, circuit?.loopBlocks, displayRegisters],
    );

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

    /** Whether a pointer event landed on empty circuit canvas rather than on a gate, menu, dialog, or outside node. */
    const isCanvasEvent = (event: React.PointerEvent | React.MouseEvent) => {
        const target = event.target as Element | null;
        if (!target) return false;
        if (
            target.closest('[data-slot^="context-menu"], [role="menu"], [role="menuitem"], [data-radix-portal]') !==
                null ||
            !operationAreaRef.current?.contains(target)
        ) {
            return false;
        }
        return !isOnGate(event);
    };

    /**
     * Starts dragging out a selection rectangle on empty canvas.
     */
    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isCanvasEvent(event)) return;
        if (event.button !== 0 && event.button !== 2) return;

        // Capturing means the rest of the drag arrives here even when the pointer leaves the canvas,
        // so releasing outside cannot leave a selection stuck open.
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // ignore if capture fails
        }
        const cell = cellAt(event.clientX, event.clientY);
        updateSelection({ from: cell, to: cell, origin: { x: event.clientX, y: event.clientY }, dragged: false });
    };

    /**
     * Keeps the browser's own menu out of the way of a right-drag on empty canvas — but only there,
     * so right-clicking a gate or context menu still works as expected.
     */
    const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isCanvasEvent(event)) event.preventDefault();
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
        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
            // ignore
        }

        const covered = operationsInRect(uiLayers, circuit?.registers ?? [], rectBetween(current.from, current.to));
        updateSelection(null);

        if (!current.dragged) {
            if (!event.shiftKey) {
                setSelectedOperationIds([]);
            }
            return;
        }

        const coveredIds = covered.map((operation) => operation.id!).filter(Boolean);
        if (coveredIds.length > 0) {
            if (event.shiftKey) {
                setSelectedOperationIds((prev) => Array.from(new Set([...prev, ...coveredIds])));
            } else {
                setSelectedOperationIds(coveredIds);
            }
        }
    };

    const operationColumnCount = Math.max(uiLayers.length + 1, 1);
    const operationAreaWidth = operationColumnCount * CELL_WIDTH;
    const circuitWidth = LABEL_WIDTH + operationAreaWidth;
    const contentHeight = flatQubits.length
        ? Math.max(...flatQubits.map((qubit) => qubit.visualY + QUBIT_HEIGHT))
        : QUBIT_HEIGHT;
    const circuitHeight = Math.max(contentHeight, QUBIT_HEIGHT);

    const toggleClassicRegister = (registerId: string) => {
        setExpandedClassicRegisterIds((current) => {
            const next = new Set(current);
            if (next.has(registerId)) {
                next.delete(registerId);
            } else {
                next.add(registerId);
            }
            return next;
        });
    };

    return (
        <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
            <CardContent className="flex flex-col h-full p-0">
                {header}

                <div className="relative flex-1 overflow-auto flex flex-col [&::-webkit-scrollbar-track]:bg-bg-subtle">
                    {displayRegisters.length === 0 && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center p-6">
                            <div className="max-w-sm rounded-xl border border-dashed border-border bg-background/80 p-6 text-center shadow-sm backdrop-blur">
                                <div className="text-sm font-semibold text-text">No registers yet</div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Create a {canUseClassicalRegisters ? 'quantum or classical' : 'quantum'} register to
                                    start building the circuit.
                                </p>
                                <Button className="mt-4" size="sm" onClick={openRegisterManager}>
                                    Open Register Manager
                                </Button>
                            </div>
                        </div>
                    )}

                    <div
                        className="relative flex-1 shrink-0 isolate"
                        style={{ width: circuitWidth, minHeight: circuitHeight }}
                    >
                        <QubitWires
                            flatQubits={flatQubits}
                            circuitWidth={circuitWidth}
                            onToggleClassicRegister={toggleClassicRegister}
                        />

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
                                registers={displayRegisters}
                                flatQubits={flatQubits}
                                isOperationDragging={isOperationDragging}
                                loopBlocks={circuit?.loopBlocks ?? []}
                                removeQuantumOperation={removeQuantumOperation}
                                removeLoopBlock={removeLoopBlock}
                                unrollLoopBlock={unrollLoopBlock}
                                ungroupQuantumOperation={ungroupQuantumOperation}
                                editRotationAngle={editRotationAngle}
                                setDraggingOperationId={setDraggingOperationId}
                                setHoverPos={setHoverPos}
                                draggingOperation={draggingOperation}
                                onEditSubcircuit={handleEditSubcircuit}
                                selectedOperationIds={selectedOperationIds}
                                onToggleSelect={handleToggleSelect}
                                onAddLoop={canUseLoops ? handleAddLoop : undefined}
                                onEditLoop={canUseLoops ? handleEditLoop : undefined}
                                onGroupSelected={canUseCompositeGates ? handleGroupSelected : undefined}
                            />

                            <DropzoneGrid
                                flatQubits={flatQubits}
                                uiLayers={uiLayers}
                                loopFrames={stableFrames}
                                activeDropZones={activeDropZones}
                                draggingOperationSize={draggingOperationSize}
                                draggingGrabOffset={draggingGrabOffset}
                                setHoverPos={setHoverPos}
                                setDraggingOperationId={setDraggingOperationId}
                                onRequestMeasurementTarget={
                                    canUseClassicalRegisters
                                        ? (ctx) => {
                                              setMeasurementContext(ctx);
                                              setMeasurementDialogOpen(true);
                                          }
                                        : undefined
                                }
                                onRequestSubcircuitMapping={handleRequestSubcircuitMapping}
                            />

                            <LoopFrames frames={loopFrames} />

                            <DropPlaceholder
                                hoverPos={hoverPos}
                                draggingOperationSize={draggingOperationSize}
                                flatQubits={flatQubits}
                            />

                            {selection && <SelectionBox rect={rectBetween(selection.from, selection.to)} />}
                        </div>
                    </div>
                    <CircuitFooter uiLayers={uiLayers} circuitWidth={circuitWidth} />
                    <MeasurementTargetDialog
                        open={measurementDialogOpen}
                        onOpenChange={(open) => {
                            setMeasurementDialogOpen(open);
                            if (!open) setMeasurementContext(null);
                        }}
                        circuit={circuit}
                        onOpenRegisterManager={openRegisterManager}
                        onSubmit={(classicBits) => {
                            if (!measurementContext) return;
                            const operation: MeasurementDto = {
                                id: crypto.randomUUID(),
                                type: 'MEASUREMENT',
                                identifier: measurementContext.operationIdentifier,
                                inverseForm: false,
                                targetQubits: measurementContext.targetQubits,
                                controlQubits: [],
                                classicBits,
                            };
                            addQuantumOperation({ quantumOperation: operation, layerIdx: measurementContext.layerIdx });
                            setMeasurementDialogOpen(false);
                            setMeasurementContext(null);
                        }}
                    />
                    <SubcircuitQubitMappingDialog
                        open={subcircuitMappingContext !== null}
                        onOpenChange={(open) => {
                            if (!open) setSubcircuitMappingContext(null);
                        }}
                        subcircuitName={subcircuitMappingContext?.subcircuitName ?? ''}
                        subcircuitQubitCount={subcircuitMappingContext?.subcircuitQubitCount ?? 0}
                        flatQubits={flatQubits.filter((q) => q.section === 'quantum')}
                        initialMapping={subcircuitMappingContext?.initialMapping}
                        onSubmit={handleSubcircuitMappingSubmit}
                    />
                </div>
                {/* Outside the scrolling canvas: these are modals, not part of the circuit. */}
                <RotationAngleDialog
                    target={angleTarget}
                    onSubmit={setRotationAngle}
                    onClose={() => setAngleTarget(null)}
                />

                <GroupCompositeDialog
                    open={isGroupDialogOpen}
                    onOpenChange={setIsGroupDialogOpen}
                    operationCount={operationsToGroup.length}
                    onSubmit={handleGroupSubmit}
                />

                <LoopBlockDialog draft={loopDraft} onSubmit={handleLoopSubmit} onClose={() => setLoopDraft(null)} />
            </CardContent>
        </Card>
    );
}

interface BuildUiLayersInput {
    activeDropZones: Set<string>;
    displayRegisters: RegisterResponse[];
    draggingOperationSize: number;
    flatQubits: FlatQubit[];
    hoverPos: HoverPos | null;
    layersWithoutDragOp: UiLayer[];
    loopBlocks: LoopBlockDto[];
    selectorRowIndex: Map<string, number>;
}

/**
 * Rows in render order, with the y each is drawn at.
 *
 * The rows follow each other with nothing in between. A header bar above every register, and the
 * gap between the quantum and classical sections, cut straight through each gate reaching across
 * two registers -- and a composed gate on `cin[0], b[0], a[0]` reaches across three. Every row
 * carries a label naming its register and index, so the header said little the reader did not have.
 *
 * A collapsed classical register is a single row standing for all its bits.
 */
function buildFlatQubits(displayRegisters: RegisterResponse[], collapsedClassicRegisterIds: Set<string>): FlatQubit[] {
    let globalCounter = 0;
    let visualYOffset = 0;

    return displayRegisters.flatMap((register, registerIndex) => {
        const size = getRegisterSize(register);
        const headerY = visualYOffset;
        const collapsed = isClassicRegister(register) && collapsedClassicRegisterIds.has(register.id);
        const visibleRows = collapsed ? 1 : size;
        const firstRowY = headerY;

        visualYOffset += visibleRows * QUBIT_HEIGHT;

        return Array.from({ length: visibleRows }).map((_, relativeIndex) => ({
            regId: register.id,
            regName: register.name,
            regIdx: registerIndex,
            relQubitIdx: collapsed ? 0 : relativeIndex,
            absQubitIdx: globalCounter++,
            regType: register.type,
            section: isClassicRegister(register) ? 'classic' : 'quantum',
            headerY,
            registerSize: size,
            isCollapsed: collapsed,
            visualY: firstRowY + relativeIndex * QUBIT_HEIGHT,
        }));
    });
}

function buildSelectorRowIndex(flatQubits: FlatQubit[]): Map<string, number> {
    return new Map(
        flatQubits.map((qubit, index) => [
            getSelectorKey({ registerId: qubit.regId, index: qubit.relQubitIdx }),
            index,
        ]),
    );
}

function buildLayersWithoutDragOp(
    circuit: CircuitResponse | undefined,
    draggingOperationId: string | null,
    selectorRowIndex: Map<string, number>,
): UiLayer[] {
    if (!circuit?.layers) return [];
    const loopBlocks = circuit.loopBlocks ?? [];

    const operations = circuit.layers.flatMap((layer, layerIndex) =>
        layer.quantumOperations
            .filter((operation) => operation.id !== draggingOperationId)
            .map((operation) => ({ ...operation, originalLayerIdx: layerIndex }) as UiQuantumOperation),
    );

    operations.sort((left, right) => compareCanonicalOrder(left, right, selectorRowIndex));
    return rescheduleOperations(withTerminalMeasurementsLast(operations), selectorRowIndex, loopBlocks);
}

function buildActiveDropZones(
    flatQubits: FlatQubit[],
    layersWithoutDragOp: UiLayer[],
    draggingOperationSize: number,
    selectorRowIndex: Map<string, number>,
): Set<string> {
    const activeSet = new Set<string>();

    for (let qubitIndex = 0; qubitIndex < flatQubits.length; qubitIndex++) {
        for (let layerIndex = 0; layerIndex <= layersWithoutDragOp.length; layerIndex++) {
            if (
                canUseDropZone(
                    qubitIndex,
                    layerIndex,
                    draggingOperationSize,
                    flatQubits,
                    layersWithoutDragOp,
                    selectorRowIndex,
                )
            ) {
                activeSet.add(`${qubitIndex}-${layerIndex}`);
            }
        }
    }

    return activeSet;
}

function buildUiLayers({
    activeDropZones,
    displayRegisters,
    draggingOperationSize,
    flatQubits,
    hoverPos,
    layersWithoutDragOp,
    loopBlocks,
    selectorRowIndex,
}: BuildUiLayersInput): UiLayer[] {
    if (!displayRegisters.length) return [];

    const allOperations = layersWithoutDragOp.flatMap((layer, layerIndex) =>
        layer.quantumOperations.map((operation) => ({ ...operation, originalLayerIdx: layerIndex })),
    );
    const dummyOperation = buildDummyOperation(hoverPos, activeDropZones, flatQubits, draggingOperationSize);

    if (dummyOperation) {
        allOperations.unshift(dummyOperation);
    }

    allOperations.sort((left, right) => compareCanonicalOrder(left, right, selectorRowIndex));
    return rescheduleOperations(
        withTerminalMeasurementsLast(allOperations),
        selectorRowIndex,
        loopBlocks,
        hoverPos?.layerIdx,
    );
}

/**
 * ASAP scheduling, through the layout that knows about repetition frames.
 *
 * A frame is placed as a unit and reserves its rectangle, so nothing that is not a member can slide
 * into a column a member leaves free on its own wire -- which would render inside the drawn frame
 * while running once. The span comes from the rendered row of each selector, so folding a register
 * cannot make two wires look like one.
 */
function rescheduleOperations(
    allOperations: UiQuantumOperation[],
    selectorRowIndex: Map<string, number>,
    loopBlocks: LoopBlockDto[],
    dummyLayerIndex?: number,
): UiLayer[] {
    return layOutColumns(allOperations, loopBlocks, {
        spanOf: (operation) => {
            const [min, max] = getOperationSpan(operation, selectorRowIndex);
            return { min, max };
        },
        minColumnFor: (operation) =>
            operation.type === 'DUMMY' && dummyLayerIndex !== undefined ? dummyLayerIndex : 0,
    });
}

function buildDummyOperation(
    hoverPos: HoverPos | null,
    activeDropZones: Set<string>,
    flatQubits: FlatQubit[],
    draggingOperationSize: number,
): UiQuantumOperation | null {
    if (!hoverPos || !activeDropZones.has(`${hoverPos.qubitIdx}-${hoverPos.layerIdx}`)) return null;

    const hoverQubit = flatQubits[hoverPos.qubitIdx];
    if (!hoverQubit) return null;

    const dummySelectors: ElementSelectorDto[] = Array.from({ length: draggingOperationSize }, (_, index) => ({
        registerId: hoverQubit.regId,
        index: hoverQubit.relQubitIdx + index,
    }));

    return {
        id: 'dummy',
        type: 'DUMMY',
        identifier: 'DUMMY',
        inverseForm: false,
        targetQubits: dummySelectors,
        controlQubits: [],
        originalLayerIdx: hoverPos.layerIdx,
    };
}

function canUseDropZone(
    qubitIndex: number,
    layerIndex: number,
    draggingOperationSize: number,
    flatQubits: FlatQubit[],
    layersWithoutDragOp: UiLayer[],
    selectorRowIndex: Map<string, number>,
): boolean {
    const selectedRows = flatQubits.slice(qubitIndex, qubitIndex + draggingOperationSize);
    if (selectedRows.length !== draggingOperationSize) return false;

    const startRow = selectedRows[0];
    if (!startRow) return false;

    const containsOnlyQuantumRows = selectedRows.every(
        (row) => row.regType === REGISTER_TYPE_QUANTUM && row.regId === startRow.regId && !row.isCollapsed,
    );
    if (!containsOnlyQuantumRows) return false;

    if (layerIndex === 0) return true;
    return hasOperationAtLeft(layersWithoutDragOp, layerIndex, qubitIndex, draggingOperationSize, selectorRowIndex);
}

function hasOperationAtLeft(
    layersWithoutDragOp: UiLayer[],
    layerIndex: number,
    qubitIndex: number,
    draggingOperationSize: number,
    selectorRowIndex: Map<string, number>,
): boolean {
    const dropSpan = [qubitIndex, qubitIndex + draggingOperationSize - 1] as const;

    return Boolean(
        layersWithoutDragOp[layerIndex - 1]?.quantumOperations.some((operation) => {
            if (operation.type === 'DUMMY') return false;
            return spansOverlap(dropSpan, getOperationSpan(operation, selectorRowIndex));
        }),
    );
}

function compareCanonicalOrder(
    left: UiQuantumOperation,
    right: UiQuantumOperation,
    selectorRowIndex: Map<string, number>,
): number {
    if (left.originalLayerIdx !== right.originalLayerIdx) return left.originalLayerIdx - right.originalLayerIdx;

    const leftIsDummy = left.type === 'DUMMY';
    const rightIsDummy = right.type === 'DUMMY';
    if (leftIsDummy !== rightIsDummy) return leftIsDummy ? -1 : 1;

    return getOperationSpan(left, selectorRowIndex)[0] - getOperationSpan(right, selectorRowIndex)[0];
}

function getOperationSpan(operation: UiQuantumOperation, selectorRowIndex: Map<string, number>): [number, number] {
    const indices = getInvolvedSelectors(operation).map(
        (selector) => selectorRowIndex.get(getSelectorKey(selector)) ?? selector.index,
    );
    if (indices.length === 0) return [0, 0];
    return [Math.min(...indices), Math.max(...indices)];
}

function spansOverlap(left: readonly [number, number], right: readonly [number, number]): boolean {
    return left[0] <= right[1] && right[0] <= left[1];
}
