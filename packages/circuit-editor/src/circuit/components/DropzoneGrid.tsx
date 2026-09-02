import React, { useCallback } from 'react';
import { CELL_WIDTH, QUBIT_HEIGHT } from '../util/layout.ts';
import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    MoveQuantumOperationRequest,
    QuantumOperationDto,
    REGISTER_TYPE_QUANTUM,
} from '@quak/circuit-core';
import { FlatQubit, HoverPos, UiLayer } from '../util/types.ts';
import { useCircuitStore } from '../../CircuitStoreContext.tsx';
import { getOperationDefinition, type OperationIdentifier } from '../../operations.ts';
import { useCircuitDrag } from '../../CircuitDragContext.tsx';
import { DragData } from '../../types.ts';

/** Finds the operation with the given id across all layers, or undefined. */
const findOperation = (layers: CircuitResponse['layers'], operationId: string): QuantumOperationDto | undefined => {
    for (const layer of layers) {
        const op = layer.quantumOperations.find((candidate) => candidate.id === operationId);
        if (op) return op;
    }
    return undefined;
};

/** Removes the operation with the given id from its layer, keeping layer positions (empty layers stay). */
const stripOperation = (layers: CircuitResponse['layers'], operationId: string): CircuitResponse['layers'] =>
    layers.map((layer) => ({ quantumOperations: layer.quantumOperations.filter((op) => op.id !== operationId) }));

const selectorsEqual = (left: ElementSelectorDto[] = [], right: ElementSelectorDto[] = []) =>
    JSON.stringify(left) === JSON.stringify(right);

/** Only a measurement carries classic bits; everything else compares against an empty list. */
const getClassicBits = (operation: QuantumOperationDto | undefined): ElementSelectorDto[] =>
    operation?.type === 'MEASUREMENT' ? operation.classicBits : [];

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

/** What the host needs to know to ask the user which classic bit a measurement writes to. */
export interface MeasurementTargetRequest {
    layerIdx: number;
    targetQubits: ElementSelectorDto[];
    controlQubits: ElementSelectorDto[];
    operationIdentifier: OperationIdentifier;
}

interface DropzoneGridProps {
    flatQubits: FlatQubit[];
    uiLayers: UiLayer[];
    activeDropZones: Set<string>;
    setHoverPos: React.Dispatch<React.SetStateAction<HoverPos | null>>;
    setDraggingOperationId: (id: string | null) => void;
    onRequestMeasurementTarget?: (context: MeasurementTargetRequest) => void;
}

export function DropzoneGrid({
    flatQubits,
    uiLayers,
    activeDropZones,
    setHoverPos,
    setDraggingOperationId,
    onRequestMeasurementTarget,
}: Readonly<DropzoneGridProps>) {
    const { circuit, setCircuit } = useCircuitStore();
    const { stopOperationDrag } = useCircuitDrag();

    /**
     * Rebuilds the circuit layers from the rendered preview (uiLayers), substituting
     * the drop placeholder (dummy) with the given operation. This makes the drop
     * result match the hover preview exactly: re-scheduling after a plain append
     * would let the new operation slip behind colliding gates (e.g. an H dropped
     * onto a CX column would land to its right, although the preview showed it
     * taking the column and pushing the CX). Returns null when no placeholder is
     * part of the preview (no active hover).
     */
    const layersFromPreview = (operation: QuantumOperationDto): CircuitResponse['layers'] | null => {
        let dummyReplaced = false;
        const layers = uiLayers.map((layer) => ({
            quantumOperations: layer.quantumOperations.map((uiOp) => {
                if (uiOp.type === 'DUMMY') {
                    dummyReplaced = true;
                    return operation;
                }
                // Strip the UI-only scheduling field before persisting.
                const { originalLayerIdx: _originalLayerIdx, ...op } = uiOp;
                return op as QuantumOperationDto;
            }),
        }));
        return dummyReplaced ? layers : null;
    };

    const addQuantumOperationLocally = (operation: QuantumOperationDto, targetLayerIdx: number) => {
        setCircuit((prev) => {
            if (!prev) return prev;

            const previewLayers = layersFromPreview(operation);
            if (previewLayers) return { ...prev, layers: previewLayers };

            // Fallback without an active preview: append to the target layer.
            const layers = prev.layers.map((layer) => ({
                quantumOperations: [...layer.quantumOperations],
            }));

            while (layers.length <= targetLayerIdx) {
                layers.push({ quantumOperations: [] });
            }

            layers[targetLayerIdx].quantumOperations.push(operation);

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
            const movedOperation: QuantumOperationDto =
                original.type === 'MEASUREMENT'
                    ? {
                          ...original,
                          targetQubits: payload.targetQubits,
                          controlQubits: [],
                          classicBits: payload.classicBits ?? original.classicBits,
                      }
                    : {
                          ...original,
                          targetQubits: payload.targetQubits,
                          controlQubits: payload.controlQubits,
                      };

            // The dragged operation is already excluded from the rendered preview,
            // so substituting the dummy re-inserts it exactly where the preview showed it.
            const previewLayers = layersFromPreview(movedOperation);
            if (previewLayers) return { ...prev, layers: previewLayers };

            // Fallback without an active preview: strip the op from its old layer, then append to the target.
            const layers = stripOperation(prev.layers, payload.quantumOperationId);
            while (layers.length <= payload.layerIdx) {
                layers.push({ quantumOperations: [] });
            }

            layers[payload.layerIdx].quantumOperations.push(movedOperation);

            return {
                ...prev,
                layers: layers.filter((layer) => layer.quantumOperations.length > 0),
            };
        });
    };

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

    // Guarded reset against hover flicker on cell changes: when crossing into an adjacent zone,
    // dragenter on the new cell fires BEFORE dragleave on the old one (HTML5 event order), so
    // hoverPos already points elsewhere and this leave must not clear it. Only leaving towards a
    // non-zone area (hoverPos still = this cell) resets.
    const handleDragLeave = (qubitIdx: number, layerIdx: number) => {
        setHoverPos((prev) => (prev?.qubitIdx === qubitIdx && prev?.layerIdx === layerIdx ? null : prev));
    };

    /** Where every operation sits in the circuit as the store currently holds it. */
    const createCircuitLookupMap = () => {
        const originalPositions = new Map<
            string,
            {
                layerIdx: number;
                targetQubits: ElementSelectorDto[];
                controlQubits: ElementSelectorDto[];
                classicBits?: ElementSelectorDto[];
            }
        >();

        if (!circuit) return originalPositions;

        for (const [layerIdx, layer] of circuit.layers.entries()) {
            for (const op of layer.quantumOperations) {
                originalPositions.set(op.id, {
                    layerIdx,
                    targetQubits: op.targetQubits,
                    controlQubits: op.controlQubits,
                    classicBits: getClassicBits(op),
                });
            }
        }
        return originalPositions;
    };

    /**
     * Compares the stored circuit against the UI layer representation to determine
     * whether any operation has shifted to a different layer or qubit position.
     * A drop that changes nothing must not produce a store update (and, in the
     * extension, a document edit).
     */
    const hasCircuitStateChanged = useCallback(
        (operationToMove: MoveQuantumOperationRequest): boolean => {
            if (!circuit) return false;

            const originalPositions = createCircuitLookupMap();

            // Check if the operation to move has moved.
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

            // Check if any other operation has moved (due to temporary detachment of the operation to move).
            for (let layerIdx = 0; layerIdx < uiLayers.length; layerIdx++) {
                for (const op of uiLayers[layerIdx].quantumOperations) {
                    const original = originalPositions.get(op.id);
                    if (!original) continue;

                    if (!hasSamePosition(original, layerIdx, op.targetQubits, op.controlQubits, getClassicBits(op))) {
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
                                id: crypto.randomUUID(),
                                type: 'ELEMENTARY_QUANTUM_GATE',
                                identifier: data.operationIdentifier,
                                inverseForm: false,
                                targetQubits,
                                controlQubits,
                                // Only rx/ry/rz carry an angle. Giving an H or an X a
                                // "default rotation" is data that means nothing, and
                                // anything writing the circuit out has to know to
                                // ignore it again.
                                rotationAngle: operationDefinition.hasRotationAngle ? Math.PI / 2 : 0,
                            };
                            addQuantumOperationLocally(operation, layerIdx);
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
                        const operationToMove = circuit?.layers
                            .flatMap((layer) => layer.quantumOperations)
                            .find((operation) => operation.id === data.id);
                        const isMeasurement = operationToMove?.type === 'MEASUREMENT';
                        const payload: MoveQuantumOperationRequest = {
                            quantumOperationId: data.id,
                            layerIdx,
                            targetQubits,
                            controlQubits: isMeasurement ? [] : controlQubits,
                            classicBits: isMeasurement ? getClassicBits(operationToMove) : undefined,
                        };
                        if (hasCircuitStateChanged(payload)) {
                            moveQuantumOperationLocally(payload);
                        }
                        break;
                    }
                    default:
                        console.error(`Unknown drag origin: ${(data as { origin?: string }).origin}`);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse drag data', error);
            } finally {
                stopOperationDrag();
                setHoverPos(null);
                setDraggingOperationId(null);
            }
        },
        // hasCircuitStateChanged carries circuit + uiLayers, so the local mutation
        // helpers below it never close over a stale preview.
        [
            circuit,
            hasCircuitStateChanged,
            stopOperationDrag,
            setCircuit,
            setHoverPos,
            setDraggingOperationId,
            onRequestMeasurementTarget,
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
                            onDragEnter={(e) => handleDragOver(e, qIdx, layerIdx)}
                            onDragOver={(e) => handleDragOver(e, qIdx, layerIdx)}
                            onDragLeave={() => handleDragLeave(qIdx, layerIdx)}
                            onDrop={(e) => handleDrop(e, qubit.regId, qubit.relQubitIdx, layerIdx)}
                        />
                    );
                }),
            )}
        </div>
    );
}
