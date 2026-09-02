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
    REGISTER_TYPE_QUANTUM,
} from '@/api/dto/circuit';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store.ts';
import { CircuitTabBar } from '@/views/circuit-view/components/CircuitTabBar.tsx';
import { QubitWires } from './components/QubitWires.tsx';
import { QuantumOperationGrid } from './components/QuantumOperationGrid.tsx';
import { DropzoneGrid } from './components/DropzoneGrid.tsx';
import { DropPlaceholder } from './components/DropPlaceholder.tsx';
import { CircuitFooter } from './components/CircuitFooter.tsx';
import type { FlatQubit, HoverPos, UiLayer, UiQuantumOperation } from './util/types.ts';
import { createCircuitService } from '@/views/circuit-view/util/circuitService.ts';
import { MeasurementTargetDialog } from './components/MeasurementTargetDialog';
import {
    CELL_WIDTH,
    LABEL_WIDTH,
    QUBIT_HEIGHT,
    REGISTER_HEADER_HEIGHT,
    REGISTER_SECTION_GAP,
} from '@/views/circuit-view/util/layout.ts';
import type { OperationIdentifier } from '@/lib/operations.ts';
import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';

export function CircuitView() {
    const {
        activeCircuit: circuit,
        activeCircuitError,
        activeCircuitLoading,
        reloadActiveCircuit,
        setActiveCircuit: setCircuit,
        activeCircuitTabId,
    } = useCircuitTabs();
    const { removeQuantumOperation, addQuantumOperation } = createCircuitService(circuit, setCircuit);

    const { isOperationDragging, draggingOperationSize } = useSelector((state: RootState) => state.dragOperation);

    const [hoverPos, setHoverPos] = useState<HoverPos | null>(null);
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

    const uiLayers = useMemo(() => {
        return buildUiLayers({
            activeDropZones,
            displayRegisters,
            draggingOperationSize,
            flatQubits,
            hoverPos,
            layersWithoutDragOp,
            selectorRowIndex,
        });
    }, [
        displayRegisters,
        hoverPos,
        layersWithoutDragOp,
        activeDropZones,
        flatQubits,
        draggingOperationSize,
        selectorRowIndex,
    ]);

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

    if (!activeCircuitTabId) {
        return (
            <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
                <CardContent className="flex h-full items-center justify-center p-0 text-gray-500">
                    No file open
                </CardContent>
            </Card>
        );
    }

    if (!circuit) {
        return (
            <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
                <CardContent className="flex flex-col h-full p-0">
                    <CircuitTabBar />
                    <div className="flex flex-1 items-center justify-center p-6 text-center">
                        <div className="max-w-sm rounded-xl border border-dashed border-border bg-background/80 p-6 shadow-sm">
                            <div className="text-sm font-semibold text-text">
                                {activeCircuitError ? 'Circuit could not be loaded' : 'Loading circuit'}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {activeCircuitError ??
                                    (activeCircuitLoading
                                        ? 'The circuit for this file is being prepared.'
                                        : 'The circuit is not available yet.')}
                            </p>
                            {activeCircuitError && (
                                <Button className="mt-4" size="sm" onClick={reloadActiveCircuit}>
                                    Retry
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full overflow-hidden border-none rounded-none bg-bg-subtle p-0 gap-0">
            <CardContent className="flex flex-col h-full p-0">
                <CircuitTabBar />

                <div className="relative flex-1 overflow-auto flex flex-col [&::-webkit-scrollbar-track]:bg-bg-subtle">
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

                    <div
                        className="relative flex-1 shrink-0 isolate"
                        style={{ width: circuitWidth, minHeight: circuitHeight }}
                    >
                        <QubitWires
                            circuit={circuit}
                            setCircuit={setCircuit}
                            flatQubits={flatQubits}
                            circuitWidth={circuitWidth}
                            onToggleClassicRegister={toggleClassicRegister}
                        />

                        <div className="absolute inset-y-0" style={{ left: LABEL_WIDTH, width: operationAreaWidth }}>
                            <QuantumOperationGrid
                                uiLayers={uiLayers}
                                registers={displayRegisters}
                                flatQubits={flatQubits}
                                isOperationDragging={isOperationDragging}
                                removeQuantumOperation={removeQuantumOperation}
                                setDraggingOperationId={setDraggingOperationId}
                                setHoverPos={setHoverPos}
                                draggingOperation={draggingOperation}
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
                    </div>
                    <CircuitFooter uiLayers={uiLayers} circuitWidth={circuitWidth} />
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
    selectorRowIndex: Map<string, number>;
}

function buildFlatQubits(displayRegisters: RegisterResponse[], collapsedClassicRegisterIds: Set<string>): FlatQubit[] {
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
        const collapsed = isClassicRegister(register) && collapsedClassicRegisterIds.has(register.id);
        const showHeader = !collapsed;
        const visibleRows = collapsed ? 1 : size;
        const firstRowY = headerY + (showHeader ? REGISTER_HEADER_HEIGHT : 0);

        visualYOffset += (showHeader ? REGISTER_HEADER_HEIGHT : 0) + visibleRows * QUBIT_HEIGHT;
        if (isClassicRegister(register)) {
            classicSectionStarted = true;
        }

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

    const operations = circuit.layers.flatMap((layer, layerIndex) =>
        layer.quantumOperations
            .filter((operation) => operation.id !== draggingOperationId)
            .map((operation) => ({ ...operation, originalLayerIdx: layerIndex }) as UiQuantumOperation),
    );

    operations.sort((left, right) => compareCanonicalOrder(left, right, selectorRowIndex));
    return rescheduleOperations(operations, selectorRowIndex);
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
    return rescheduleOperations(allOperations, selectorRowIndex, hoverPos?.layerIdx);
}

function rescheduleOperations(
    allOperations: UiQuantumOperation[],
    selectorRowIndex: Map<string, number>,
    dummyLayerIndex?: number,
): UiLayer[] {
    const newLayers: UiLayer[] = [];
    const lastLayerPerSelector = new Map<string, number>();

    for (const operation of allOperations) {
        const involvedKeys = getInvolvedSelectors(operation).map(getSelectorKey);
        const earliestLayer = findEarliestLayer(involvedKeys, lastLayerPerSelector, operation, dummyLayerIndex);
        const layerIndex = findAvailableLayer(earliestLayer, newLayers, operation, selectorRowIndex);

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

function findAvailableLayer(
    startLayer: number,
    layers: UiLayer[],
    operation: UiQuantumOperation,
    selectorRowIndex: Map<string, number>,
): number {
    let layerIndex = startLayer;

    while (layerIndex < layers.length && hasCollisionInLayer(operation, layers[layerIndex], selectorRowIndex)) {
        layerIndex++;
    }

    return layerIndex;
}

function hasCollisionInLayer(
    operation: UiQuantumOperation,
    layer: UiLayer,
    selectorRowIndex: Map<string, number>,
): boolean {
    const requiredKeys = new Set(getInvolvedSelectors(operation).map(getSelectorKey));
    const operationSpan = getOperationSpan(operation, selectorRowIndex);

    return layer.quantumOperations.some((existingOperation) => {
        const existingKeys = getInvolvedSelectors(existingOperation).map(getSelectorKey);
        return (
            existingKeys.some((key) => requiredKeys.has(key)) ||
            spansOverlap(operationSpan, getOperationSpan(existingOperation, selectorRowIndex))
        );
    });
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
