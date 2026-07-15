import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button.tsx';
import { useMemo, useState } from 'react';
import {
    type CircuitResponse,
    ElementSelectorDto,
    getInvolvedSelectors,
    getRegisterSize,
    getSelectorKey,
    isClassicRegister,
    isQuantumRegister,
    MeasurementDto,
    type RegisterResponse,
} from '@/api/dto/circuit';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store.ts';
import { CircuitToolbar } from './components/CircuitToolbar.tsx';
import { QubitWires } from './components/QubitWires.tsx';
import { QuantumOperationGrid } from './components/QuantumOperationGrid.tsx';
import { DropzoneGrid } from './components/DropzoneGrid.tsx';
import { DropPlaceholder } from './components/DropPlaceholder.tsx';
import { CircuitFooter } from './components/CircuitFooter.tsx';
import type { FlatQubit, HoverPos, UiLayer, UiQuantumOperation } from './util/types.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { MeasurementTargetDialog } from './components/MeasurementTargetDialog';
import {
    LABEL_WIDTH,
    QUBIT_HEIGHT,
    REGISTER_HEADER_HEIGHT,
    REGISTER_SECTION_GAP,
} from '@/views/circuit-view/util/layout.ts';
import type { OperationIdentifier } from '@/lib/operations.ts';

import { useProject } from '@/contexts/ProjectContext';

export function CircuitView() {
    const { circuit, setCircuit } = useProject();
    const { removeQuantumOperation, addQuantumOperation } = createCircuitService(circuit, setCircuit);

    const { isOperationDragging, draggingOperationSize } = useSelector((state: RootState) => state.dragOperation);

    const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
    const [draggingOperationId, setDraggingOperationId] = useState<string | null>(null);
    const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
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

    const flatQubits = useMemo(() => {
        return buildFlatQubits(displayRegisters);
    }, [displayRegisters]);

    const layersWithoutDragOp = useMemo(() => {
        return buildLayersWithoutDragOp(circuit, draggingOperationId);
    }, [circuit, draggingOperationId]);

    const activeDropZones = useMemo(() => {
        return buildActiveDropZones(flatQubits, layersWithoutDragOp, draggingOperationSize);
    }, [layersWithoutDragOp, flatQubits, draggingOperationSize]);

    const uiLayers = useMemo(() => {
        return buildUiLayers({
            activeDropZones,
            displayRegisters,
            draggingOperationSize,
            flatQubits,
            hoverPos,
            layersWithoutDragOp,
        });
    }, [displayRegisters, hoverPos, layersWithoutDragOp, activeDropZones, flatQubits, draggingOperationSize]);

    return (
        <Card className="h-full overflow-hidden border-none bg-bg-subtle">
            <CardContent className="flex flex-col h-full">
                <CircuitToolbar circuit={circuit} setCircuit={setCircuit} />

                <div className="relative flex-1 overflow-auto">
                    {displayRegisters.length === 0 && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center p-6">
                            <div className="max-w-sm rounded-xl border border-dashed border-border bg-background/80 p-6 text-center shadow-sm backdrop-blur">
                                <div className="text-sm font-semibold text-text">No registers yet</div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Create a quantum or classical register to start building the circuit.
                                </p>
                                <Button
                                    className="mt-4"
                                    size="sm"
                                    onClick={() => globalThis.dispatchEvent(new CustomEvent('open-register-manager'))}
                                >
                                    Open Register Manager
                                </Button>
                            </div>
                        </div>
                    )}

                    <QubitWires circuit={circuit} setCircuit={setCircuit} flatQubits={flatQubits} />

                    <div className="absolute inset-y-0 right-0" style={{ left: LABEL_WIDTH }}>
                        <QuantumOperationGrid
                            uiLayers={uiLayers}
                            registers={displayRegisters}
                            isOperationDragging={isOperationDragging}
                            removeQuantumOperation={removeQuantumOperation}
                            setDraggingOperationId={setDraggingOperationId}
                            setHoverPos={setHoverPos}
                        />

                        <DropzoneGrid
                            circuit={circuit}
                            setCircuit={setCircuit}
                            flatQubits={flatQubits}
                            uiLayers={uiLayers}
                            activeDropZones={activeDropZones}
                            setHoverPos={setHoverPos}
                            setDraggingOperationId={setDraggingOperationId}
                            onRequestMeasurementTarget={(ctx) => {
                                setMeasurementContext(ctx);
                                setMeasurementDialogOpen(true);
                            }}
                        />

                        <DropPlaceholder
                            hoverPos={hoverPos}
                            draggingOperationSize={draggingOperationSize}
                            flatQubits={flatQubits}
                        />
                    </div>
                    <MeasurementTargetDialog
                        open={measurementDialogOpen}
                        onOpenChange={(open) => {
                            setMeasurementDialogOpen(open);
                            if (!open) setMeasurementContext(null);
                        }}
                        circuit={circuit}
                        onOpenRegisterManager={() => globalThis.dispatchEvent(new CustomEvent('open-register-manager'))}
                        onSubmit={(classicBits) => {
                            if (!measurementContext) return;
                            const operation: MeasurementDto = {
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
                </div>

                <CircuitFooter uiLayers={uiLayers} />
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
}

function buildFlatQubits(displayRegisters: RegisterResponse[]): FlatQubit[] {
    let globalCounter = 0;
    let visualYOffset = 0;
    let classicSectionStarted = false;

    return displayRegisters.flatMap((register, registerIndex) => {
        const startsClassicSection = isClassicRegister(register) && !classicSectionStarted;
        if (registerIndex > 0 && startsClassicSection) {
            visualYOffset += REGISTER_SECTION_GAP;
        }

        const size = getRegisterSize(register);
        const headerY = visualYOffset;
        visualYOffset += REGISTER_HEADER_HEIGHT + size * QUBIT_HEIGHT;
        if (isClassicRegister(register)) {
            classicSectionStarted = true;
        }

        return Array.from({ length: size }).map((_, relativeIndex) => ({
            regId: register.id,
            regName: register.name,
            regIdx: registerIndex,
            relQubitIdx: relativeIndex,
            absQubitIdx: globalCounter++,
            regType: register.type,
            section: isClassicRegister(register) ? 'classic' : 'quantum',
            visualY: headerY + REGISTER_HEADER_HEIGHT + relativeIndex * QUBIT_HEIGHT,
        }));
    });
}

function buildLayersWithoutDragOp(
    circuit: CircuitResponse | undefined,
    draggingOperationId: string | null,
): UiLayer[] {
    if (!circuit?.layers) return [];

    const operations = circuit.layers.flatMap((layer, layerIndex) =>
        layer.quantumOperations
            .filter((operation) => operation.id !== draggingOperationId)
            .map((operation) => ({ ...operation, originalLayerIdx: layerIndex }) as UiQuantumOperation),
    );

    return rescheduleOperations(operations);
}

function buildActiveDropZones(
    flatQubits: FlatQubit[],
    layersWithoutDragOp: UiLayer[],
    draggingOperationSize: number,
): Set<string> {
    const activeSet = new Set<string>();

    for (let qubitIndex = 0; qubitIndex < flatQubits.length; qubitIndex++) {
        for (let layerIndex = 0; layerIndex <= layersWithoutDragOp.length; layerIndex++) {
            if (canUseDropZone(qubitIndex, layerIndex, draggingOperationSize, flatQubits, layersWithoutDragOp)) {
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
}: BuildUiLayersInput): UiLayer[] {
    if (!displayRegisters.length) return [];

    const allOperations = layersWithoutDragOp.flatMap((layer, layerIndex) =>
        layer.quantumOperations.map((operation) => ({ ...operation, originalLayerIdx: layerIndex })),
    );
    const dummyOperation = buildDummyOperation(hoverPos, activeDropZones, flatQubits, draggingOperationSize);

    if (dummyOperation) {
        allOperations.unshift(dummyOperation);
    }

    allOperations.sort((left, right) => left.originalLayerIdx - right.originalLayerIdx);
    return rescheduleOperations(allOperations, hoverPos?.layerIdx);
}

function rescheduleOperations(allOperations: UiQuantumOperation[], dummyLayerIndex?: number): UiLayer[] {
    const newLayers: UiLayer[] = [];
    const lastLayerPerSelector = new Map<string, number>();

    for (const operation of allOperations) {
        const involvedKeys = getInvolvedSelectors(operation).map(getSelectorKey);
        const earliestLayer = findEarliestLayer(involvedKeys, lastLayerPerSelector, operation, dummyLayerIndex);
        const layerIndex = findAvailableLayer(earliestLayer, newLayers, operation);

        while (newLayers.length <= layerIndex) {
            newLayers.push({ quantumOperations: [] });
        }

        newLayers[layerIndex].quantumOperations.push(operation);
        involvedKeys.forEach((key) => lastLayerPerSelector.set(key, layerIndex));
    }

    return newLayers.filter((layer) => layer.quantumOperations.length > 0);
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
): boolean {
    if (qubitIndex + draggingOperationSize > flatQubits.length) return false;
    if (layerIndex === 0) return true;
    return hasOperationAtLeft(layersWithoutDragOp, layerIndex, qubitIndex, draggingOperationSize);
}

function hasOperationAtLeft(
    layersWithoutDragOp: UiLayer[],
    layerIndex: number,
    qubitIndex: number,
    draggingOperationSize: number,
): boolean {
    return Boolean(
        layersWithoutDragOp[layerIndex - 1]?.quantumOperations.some(
            (operation) =>
                operation.type !== 'DUMMY' &&
                getInvolvedSelectors(operation).some(
                    (selector) => qubitIndex <= selector.index && selector.index < qubitIndex + draggingOperationSize,
                ),
        ),
    );
}

function findEarliestLayer(
    involvedKeys: string[],
    lastLayerPerSelector: Map<string, number>,
    operation: UiQuantumOperation,
    dummyLayerIndex?: number,
): number {
    const earliestLayer = Math.max(0, ...involvedKeys.map((key) => lastLayerPerSelector.get(key) ?? -1));

    return operation.type === 'DUMMY' && dummyLayerIndex !== undefined
        ? Math.max(earliestLayer, dummyLayerIndex)
        : earliestLayer;
}

function findAvailableLayer(startLayer: number, layers: UiLayer[], operation: UiQuantumOperation): number {
    let layerIndex = startLayer;

    while (layerIndex < layers.length && hasCollisionInLayer(operation, layers[layerIndex])) {
        layerIndex++;
    }

    return layerIndex;
}

function hasCollisionInLayer(operation: UiQuantumOperation, layer: UiLayer): boolean {
    const requiredKeys = new Set(getInvolvedSelectors(operation).map(getSelectorKey));
    return layer.quantumOperations.some((existingOperation) => {
        if (operation.type === 'MEASUREMENT' && existingOperation.type === 'MEASUREMENT') return true;
        return getInvolvedSelectors(existingOperation).some((selector) => requiredKeys.has(getSelectorKey(selector)));
    });
}
