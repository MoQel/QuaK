import React, { SetStateAction, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { stopOperationDrag } from '@/store/circuit/dragOperationSlice.ts';
import { CELL_WIDTH, QUBIT_HEIGHT } from '@/views/circuit-view/util/layout.ts';
import { isCompositeGate, REGISTER_TYPE_QUANTUM } from '@/api/dto/circuit.ts';
import type {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    MoveQuantumOperationRequest,
    QuantumOperationDto,
    SubcircuitOperationDto,
} from '@/api/dto/circuit.ts';
import { dropAnchorRow } from '@/views/circuit-view/util/dropAnchor.ts';
import { LoopFrame } from '@/views/circuit-view/util/loopFrames.ts';
import { rebindMembership } from '@/views/circuit-view/util/loopMembership.ts';
import { getOperationSpan } from '@/views/circuit-view/util/spans.ts';
import { withFreshIds } from '@/lib/operationIds.ts';
import { rebindComposite } from '@/views/circuit-view/util/rebindComposite.ts';
import { DragData, FlatQubit, HoverPos, UiLayer } from '@/views/circuit-view/util/types.ts';
import { getOperationDefinition } from '@/lib/operations.ts';
import type { OperationIdentifier } from '@/lib/operations.ts';

const findOperation = (layers: CircuitResponse['layers'], operationId: string): QuantumOperationDto | undefined => {
    for (const layer of layers) {
        const op = layer.quantumOperations.find((candidate) => candidate.id === operationId);
        if (op) return op;
    }
    return undefined;
};

const stripOperation = (layers: CircuitResponse['layers'], operationId: string): CircuitResponse['layers'] =>
    layers.map((layer) => ({ quantumOperations: layer.quantumOperations.filter((op) => op.id !== operationId) }));

const selectorsEqual = (left: ElementSelectorDto[] = [], right: ElementSelectorDto[] = []) =>
    JSON.stringify(left) === JSON.stringify(right);

const getClassicBits = (
    operation:
        | {
              type: string;
              classicBits?: ElementSelectorDto[];
          }
        | undefined,
) => (operation?.type === 'MEASUREMENT' ? (operation.classicBits ?? []) : []);

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

/**
 * How many wires a dropped operation takes, and how they split into controls and targets.
 *
 * An operation that already exists — the one being moved, or the template of a user-defined gate
 * dragged in from the library — answers for itself. Only a built-in has to be looked up, which is
 * just as well: the catalogue holds nothing else and warns about every name it does not know.
 */
const qubitCountsOf = (
    own: QuantumOperationDto | undefined,
    identifier: string,
): { controlSize: number; targetSize: number } => {
    if (own) return { controlSize: own.controlQubits.length, targetSize: own.targetQubits.length };

    const definition = getOperationDefinition(identifier);
    return { controlSize: definition.controlSize, targetSize: definition.targetSize };
};

interface DropzoneGridProps {
    circuit: CircuitResponse | undefined;
    setCircuit: React.Dispatch<SetStateAction<CircuitResponse | undefined>>;
    flatQubits: FlatQubit[];
    uiLayers: UiLayer[];
    /** The repetition frames as currently drawn; a drop inside one joins it, outside one leaves it. */
    loopFrames: LoopFrame[];
    activeDropZones: Set<string>;
    /** Number of wires the dragged operation covers; decides how far its anchor may sit. */
    draggingOperationSize: number;
    /** Which wire of the dragged operation the pointer grabbed, counted from its topmost one. */
    draggingGrabOffset: number;
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
    loopFrames,
    activeDropZones,
    draggingOperationSize,
    draggingGrabOffset,
    setHoverPos,
    setDraggingOperationId,
    onRequestMeasurementTarget,
}: Readonly<DropzoneGridProps>) {
    const dispatch = useDispatch();

    /** The cell the pointer is currently in; see handleDragLeave for why this is kept by cell. */
    const hoveredCellRef = useRef<string | null>(null);

    const layersFromPreview = (operation: QuantumOperationDto): CircuitResponse['layers'] | null => {
        let dummyReplaced = false;
        const layers = uiLayers.map((layer) => ({
            quantumOperations: layer.quantumOperations.map((uiOp) => {
                if (uiOp.type === 'DUMMY') {
                    dummyReplaced = true;
                    return operation;
                }
                const { originalLayerIdx: _originalLayerIdx, ...op } = uiOp;
                return op as QuantumOperationDto;
            }),
        }));
        return dummyReplaced ? layers : null;
    };

    const addQuantumOperationLocally = (operation: QuantumOperationDto, targetLayerIdx: number) => {
        setCircuit((prev) => {
            if (!prev) return prev;

            const newOperation = { ...operation, id: crypto.randomUUID() };

            const previewLayers = layersFromPreview(newOperation);
            if (previewLayers) return { ...prev, layers: previewLayers };

            const layers = prev.layers.map((layer) => ({
                quantumOperations: [...layer.quantumOperations],
            }));

            while (layers.length <= targetLayerIdx) {
                layers.push({ quantumOperations: [] });
            }

            layers[targetLayerIdx].quantumOperations.push(newOperation);

            return {
                ...prev,
                layers,
            };
        });
    };

    const moveQuantumOperationLocally = (payload: MoveQuantumOperationRequest) => {
        setCircuit((prev) => {
            if (!prev) return prev;

            const original = findOperation(prev.layers, payload.quantumOperationId);
            if (!original) return prev;
            // A composite's body is stored bound to the call's qubits, so moving the box has to
            // re-bind it: replacing only targetQubits would leave the body on wires the box no
            // longer covers.
            let movedOperation: QuantumOperationDto;
            if (isCompositeGate(original)) {
                movedOperation = rebindComposite(original, payload.targetQubits);
            } else if (original.type === 'MEASUREMENT') {
                movedOperation = {
                    ...original,
                    targetQubits: payload.targetQubits,
                    controlQubits: [],
                    classicBits: payload.classicBits ?? original.classicBits,
                };
            } else {
                movedOperation = {
                    ...original,
                    targetQubits: payload.targetQubits,
                    controlQubits: payload.controlQubits,
                };
            }

            // Which loops the gate belongs to after landing — see `rebindMembership`.
            //
            // Judged against the cell the user aimed at, deliberately not against where the
            // placeholder ended up: the scheduler reserves a frame's rectangle against everything
            // that is not a member, so the preview can never show an outsider *inside* a frame. Read
            // from the preview, dropping something into a loop would therefore be impossible.
            const loopBlocks = rebindMembership(
                prev.loopBlocks ?? [],
                loopFrames,
                payload.quantumOperationId,
                payload.layerIdx,
                getOperationSpan(prev.registers, movedOperation),
            );

            // The dragged operation is already excluded from the rendered preview,
            // so substituting the dummy re-inserts it exactly where the preview showed it.
            const previewLayers = layersFromPreview(movedOperation);
            if (previewLayers) return { ...prev, layers: previewLayers, loopBlocks };

            const layers = stripOperation(prev.layers, payload.quantumOperationId);
            while (layers.length <= payload.layerIdx) {
                layers.push({ quantumOperations: [] });
            }

            layers[payload.layerIdx].quantumOperations.push(movedOperation);

            return {
                ...prev,
                layers: layers.filter((layer) => layer.quantumOperations.length > 0),
                loopBlocks,
            };
        });
    };

    const handleDragOver = (e: React.DragEvent, cellKey: string, anchorIdx: number, layerIdx: number) => {
        e.preventDefault();
        hoveredCellRef.current = cellKey;
        // Use a functional update to access the latest state without triggering unnecessary re-renders.
        // Returning the previous value unchanged causes React to bail out of the render cycle,
        // preventing performance degradation from rapid mousemove events (render thrashing).
        setHoverPos((prev) =>
            prev?.qubitIdx === anchorIdx && prev?.layerIdx === layerIdx ? prev : { qubitIdx: anchorIdx, layerIdx },
        );
    };

    /**
     * Records the cell the pointer entered without moving the preview.
     *
     * Used by the cells that decline the drop: the leave guard keys on the current cell, so a
     * declining cell has to claim it — otherwise the drag-leave of the valid cell just left behind
     * would clear the preview, which is the blink this whole arrangement avoids.
     */
    const markCellHovered = (cellKey: string) => {
        hoveredCellRef.current = cellKey;
    };

    // Guarded reset against hover flicker on cell changes: when crossing into an adjacent zone,
    // dragenter on the new cell fires BEFORE dragleave on the old one (HTML5 event order), so by the
    // time this runs the pointer may already be somewhere else. The guard keys on the *cell* rather
    // than on the resulting hover position, because several rows now resolve to the same anchor and
    // comparing anchors would let the old cell's leave wipe the hover its neighbour just set.
    const handleDragLeave = (cellKey: string) => {
        if (hoveredCellRef.current !== cellKey) return;
        hoveredCellRef.current = null;
        setHoverPos(null);
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

                // Whenever there is an actual operation to ask, its own qubits are the truth: the one
                // already in the circuit for a move, the dragged template for a custom gate from the
                // library. The built-in catalogue knows only the built-ins, so a user-defined gate
                // would otherwise be truncated to the single-qubit fallback and lose qubits.
                const dragged =
                    data.origin === 'circuit' && data.id ? findOperation(circuit?.layers ?? [], data.id) : undefined;
                const { controlSize, targetSize } = data.subcircuit
                    ? { controlSize: 0, targetSize: Math.max(data.subcircuit.qubitCount, 1) }
                    : qubitCountsOf(dragged ?? data.composite, data.operationIdentifier);

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
                        if (data.composite) {
                            // A user-defined gate, recognised by the template rather than by the
                            // catalogue lookup: its name is an arbitrary identifier the catalogue
                            // does not have. The body travels bound to the wires the template was
                            // collected from, so it has to be re-bound onto the drop's wires — and
                            // copied under fresh ids, body included, since this is a new operation
                            // and not the one the template came from.
                            const operation = withFreshIds(rebindComposite(data.composite, targetQubits));
                            addQuantumOperationLocally(operation, layerIdx);
                            break;
                        }

                        if (data.subcircuit) {
                            // Nothing to re-bind: a subcircuit stores only the id of the circuit it
                            // points at, and its body stays where it is. The name rides along so the
                            // box is labelled before the next read fills it in again.
                            const operation: SubcircuitOperationDto = {
                                id: crypto.randomUUID(),
                                type: 'SUBCIRCUIT_OPERATION',
                                identifier: data.subcircuit.name,
                                inverseForm: false,
                                definitionCircuitId: data.subcircuit.circuitId,
                                definitionName: data.subcircuit.name,
                                targetQubits,
                                controlQubits,
                            };
                            addQuantumOperationLocally(operation, layerIdx);
                            break;
                        }

                        const operationDefinition = getOperationDefinition(data.operationIdentifier);
                        if (operationDefinition.type === 'ELEMENTARY_QUANTUM_GATE') {
                            const operation: ElementaryQuantumGateDto = {
                                type: 'ELEMENTARY_QUANTUM_GATE',
                                identifier: data.operationIdentifier,
                                inverseForm: false,
                                targetQubits,
                                controlQubits,
                                rotationAngle: Math.PI / 2, // standard rotation
                            };
                            addQuantumOperationLocally(operation, layerIdx);
                        } else if (operationDefinition.type === 'MEASUREMENT') {
                            // A measurement needs a classic bit to write to, which the user picks in
                            // a dialog; it is added once that comes back, not here.
                            onRequestMeasurementTarget?.({
                                layerIdx,
                                targetQubits,
                                controlQubits: [],
                                // Narrowed by the lookup above: only a built-in resolves to a
                                // definition at all, so reaching here means the name is one.
                                operationIdentifier: data.operationIdentifier as OperationIdentifier,
                            });
                        }
                        break;
                    }
                    case 'circuit': {
                        if (!data.id) break;

                        const payload: MoveQuantumOperationRequest = {
                            quantumOperationId: data.id,
                            layerIdx,
                            targetQubits,
                            controlQubits: dragged?.type === 'MEASUREMENT' ? [] : controlQubits,
                            classicBits: dragged?.type === 'MEASUREMENT' ? getClassicBits(dragged) : undefined,
                        };
                        if (hasCircuitStateChanged(payload)) {
                            moveQuantumOperationLocally(payload);
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
        // `circuit` is read directly now (to size a dragged operation from its own qubits), so it
        // must be a dependency rather than riding along on hasCircuitStateChanged's identity.
        [circuit, hasCircuitStateChanged, dispatch, onRequestMeasurementTarget],
    );

    return (
        <div className="absolute inset-0 z-10">
            {flatQubits.map((qubit, qIdx) =>
                Array.from({ length: uiLayers.length + 1 }).map((_, layerIdx) => {
                    const anchorIdx = dropAnchorRow(qIdx, draggingGrabOffset, draggingOperationSize, flatQubits.length);
                    const anchor = flatQubits[anchorIdx];
                    const cellKey = `${qIdx}-${layerIdx}`;

                    // A cell exists for every position, droppable or not. Leaving the forbidden ones
                    // out left literal holes in the grid: crossing one fired a drag-leave with no
                    // drag-enter to follow, so the placeholder blinked away and back and the drag
                    // felt like it kept losing its grip. A forbidden cell now simply declines the
                    // drop — no preventDefault, so the cursor says "no" — while the last valid
                    // preview stays put. A classical row is one of those forbidden positions.
                    const isDroppable =
                        anchor !== undefined &&
                        anchor.regType === REGISTER_TYPE_QUANTUM &&
                        activeDropZones.has(`${anchorIdx}-${layerIdx}`);

                    return (
                        <div
                            key={`drop-${cellKey}`}
                            style={{
                                position: 'absolute',
                                left: layerIdx * CELL_WIDTH,
                                // Rows are placed at their rendered y: register headers, section
                                // gaps and collapsed registers all break `qIdx * QUBIT_HEIGHT`.
                                top: qubit.visualY,
                                width: CELL_WIDTH,
                                height: QUBIT_HEIGHT,
                            }}
                            onDragEnter={(e) =>
                                isDroppable ? handleDragOver(e, cellKey, anchorIdx, layerIdx) : markCellHovered(cellKey)
                            }
                            onDragOver={(e) =>
                                isDroppable ? handleDragOver(e, cellKey, anchorIdx, layerIdx) : markCellHovered(cellKey)
                            }
                            onDragLeave={() => handleDragLeave(cellKey)}
                            onDrop={
                                isDroppable
                                    ? (e) => handleDrop(e, anchor.regId, anchor.relQubitIdx, layerIdx)
                                    : undefined
                            }
                        />
                    );
                }),
            )}
        </div>
    );
}
