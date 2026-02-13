import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Minus, Plus, Trash} from "lucide-react";
import {useCallback, useEffect, useMemo, useState} from "react";
import styles from "@/App.module.css";
import {api} from "@/api/api";
import {
    AddQuantumOperationRequest,
    CircuitResponse, ElementaryQuantumGateDto, ElementSelectorDto, MoveQuantumOperationRequest, RegisterResponse,
} from "@/api/dto/circuit";
import {CELL_WIDTH, QUBIT_HEIGHT} from '@/views/circuit-view/layout.ts';
import {
    getOperationControlSizeByIdentifier, getOperationTargetSizeByIdentifier, OperationIdentifier
} from '@/api/dto/OperationDefinition.ts';
import {ElementaryQuantumGate} from '@/views/circuit-view/ElementaryQuantumGate.tsx'

interface CircuitViewProps {
    isGateDragging: boolean,
    setIsGateDragging: (value: boolean) => void,
    draggingGateSize: number,
    setDraggingGateSize: (size: number) => void
}

interface DragData {
    origin: "library" | "circuit";
    operationDefinition: OperationIdentifier;
    id?: string;
}

const getRegisterSize = (reg: RegisterResponse): number => {
    if ('numberOfQubits' in reg) return reg.numberOfQubits;
    if ('numberOfBits' in reg) return reg.numberOfBits;
    return 0;
};

function useCircuitActions() {
    const [circuit, setCircuit] = useState<CircuitResponse>();

    const initCircuit = useCallback (() => {
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
        circuit,
        fetchCircuit: initCircuit,
        addQubit,
        deleteLastQubit,
        resetCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation
    };
}

export function CircuitView({isGateDragging, setIsGateDragging, draggingGateSize, setDraggingGateSize}: Readonly<CircuitViewProps>) {
    // API State
    const {
        circuit,
        fetchCircuit,
        addQubit,
        deleteLastQubit,
        resetCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation
    } = useCircuitActions();

    // UI State
    const [hoverPos, setHoverPos] = useState<{ qubitIdx: number, layerIdx: number } | null>(null);
    const [draggingOperationId, setDraggingOperationId] = useState<string | null>(null);
    const [shiftedOperations, setShiftedOperations] = useState<Record<string, number>>({});

    useEffect(() => fetchCircuit(), []);

    /**
     * Flattens the nested register structure into a single array of qubits
     * for easier rendering of wires and drop zones.
     */
    const flatQubits = useMemo(() => {
        if (!circuit?.registers) return [];

        let globalCounter = 0;
        return circuit.registers.flatMap((reg, regIdx) =>
            Array.from({ length: getRegisterSize(reg) }).map((_, qubitIdx) => ({
                regId: reg.id,
                regName: reg.name,
                regIdx,
                qubitIdx, // Index within the register
                globalIdx: globalCounter++ // Absolute vertical index
            }))
        );
    }, [circuit?.registers]);

    /**
     * Determines valid drop zones based on circuit rules.
     * Returns a Set of keys in format "qubitIdx-layerIdx".
     */
    const activeDropZones = useMemo(() => {
        const activeSet = new Set<string>();
        if (!circuit) return activeSet;

        const numLayers = circuit.layers.length;
        const numQubits = flatQubits.length;

        for (let qubitIdx = 0; qubitIdx < numQubits; qubitIdx++) {
            for (let layerIdx = 0; layerIdx <= numLayers; layerIdx++) {
                // Rule 1: First layer is always available
                if (layerIdx === 0) {
                    activeSet.add(`${qubitIdx}-${layerIdx}`);
                    continue;
                }

                // Rule 2: Check for existing gate at current position (q, layer)
                const hasGateAtCurrent = circuit.layers[layerIdx]?.quantumOperations.some(op =>
                    [...op.targetQubits, ...op.controlQubits].some(sel => sel.index === qubitIdx)
                );

                // Rule 3: Check for gate at position to the left (q, layer-1)
                const hasGateAtLeft = circuit.layers[layerIdx - 1]?.quantumOperations.some(op =>
                    [...op.targetQubits, ...op.controlQubits].some(sel => sel.index === qubitIdx)
                );

                if (hasGateAtCurrent || hasGateAtLeft) {
                    activeSet.add(`${qubitIdx}-${layerIdx}`);
                }
            }
        }
        return activeSet;
    }, [circuit, flatQubits.length]);

    /**
     * Calculates the visual shifting of gates ("Ripple Effect") when a user
     * drags a gate over an existing structure.
     */
    const calculateShifting = useCallback((targetLayerIdx: number, qubitIdx: number, gateSize: number) => {
        if (!circuit) return;

        const newShifted: Record<string, number> = {};

        // Initial set of qubits being acted upon by the dragged gate
        let qubitsPushingRight = new Set(
            Array.from({ length: gateSize }, (_, i) => qubitIdx + i)
        );

        // Iterate through layers starting from the drop target
        for (const [layerIdx, layer] of circuit.layers.entries()) {
            if (layerIdx < targetLayerIdx) return;

            const nextQubitsPushingRight = new Set<number>();

            for (const op of layer.quantumOperations) {
                const opIndices = [...op.targetQubits, ...op.controlQubits].map(sel => sel.index);

                // Check collision: Does the "wave" hit this operation?
                const isHitByShift = opIndices.some(idx => qubitsPushingRight.has(idx));
                if (!isHitByShift) continue;

                // Mark operation for shifting
                newShifted[op.id!] = CELL_WIDTH;
                // This operation now pushes everything on its own wires in the NEXT layer
                for (const idx of opIndices) {
                    nextQubitsPushingRight.add(idx);
                }
            }

            // Propagate the wave to the next layer
            qubitsPushingRight = nextQubitsPushingRight;
        }

        setShiftedOperations(newShifted);
    }, [circuit]);

    /**
     * Checks if an operation actually changed position.
     */
    const hasOperationMoved = useCallback((
        operationId: string,
        layerIdx: number,
        newTargetQubits: ElementSelectorDto[],
        newControlQubits: ElementSelectorDto[]
    ): boolean => {
        if (!circuit) return false;

        for (let idx = 0; idx < circuit.layers.length; idx++) {
            const op = circuit.layers[idx].quantumOperations.find(o => o.id === operationId);
            if (op) {
                const isSameLayer = idx === layerIdx;
                const isSameTarget = JSON.stringify(op.targetQubits) === JSON.stringify(newTargetQubits);
                const isSameControl = JSON.stringify(op.controlQubits) === JSON.stringify(newControlQubits);

                return !(isSameLayer && isSameTarget && isSameControl);
            }
        }
        return false;
    }, [circuit]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, regId: string, regIdx: number, layerIdx: number) => {
        e.preventDefault();
        try {
            const data: DragData = JSON.parse(e.dataTransfer.getData("text/plain"));
            const controlSize = getOperationControlSizeByIdentifier(data.operationDefinition);
            const targetSize = getOperationTargetSizeByIdentifier(data.operationDefinition);

            const controlQubits: ElementSelectorDto[] = Array.from({ length: controlSize }, (_, i) => ({
                registerId: regId,
                index: regIdx + i
            }));

            const targetQubits: ElementSelectorDto[] = Array.from({ length: targetSize }, (_, i) => ({
                registerId: regId,
                index: regIdx + i
            }));

            switch (data.origin) {
                case "library": {
                    const gate: ElementaryQuantumGateDto = {
                        type: 'ELEMENTARY_QUANTUM_GATE',
                        operationDefinition: data.operationDefinition,
                        inverseForm: false,
                        targetQubits,
                        controlQubits,
                        rotationAngle: 0
                    };
                    addQuantumOperation({ quantumOperation: gate, layerIdx });
                    break;
                }
                case "circuit": {
                    if (hasOperationMoved(data.id!, layerIdx, targetQubits, controlQubits)) {
                        moveQuantumOperation({
                            quantumOperationId: data.id!,
                            layerIdx,
                            targetQubits,
                            controlQubits
                        });
                    }
                    break;
                }
                default:
                    console.error(`Unknown drag origin: ${(data as any).origin}`);
                    break;
            }
        } catch (error) {
            console.error("Failed to parse drag data", error);
        } finally {
            // Cleanup UI state
            setHoverPos(null);
            setShiftedOperations({});
            setIsGateDragging(false);
            setDraggingOperationId(null);
        }
    }, [addQuantumOperation, moveQuantumOperation, hasOperationMoved, setIsGateDragging]);

    const handleDragOver = (e: React.DragEvent, qIdx: number, layerIdx: number) => {
        e.preventDefault();
        // Only update state if position actually changed to prevent render thrashing
        if (hoverPos?.qubitIdx !== qIdx || hoverPos?.layerIdx !== layerIdx) {
            setHoverPos({ qubitIdx: qIdx, layerIdx });
            calculateShifting(layerIdx, qIdx, draggingGateSize);
        }
    };

    return (
        <Card className="h-full overflow-hidden">
            <CardContent className="flex flex-col h-full">

                {/* Toolbar */}
                <div className="pb-5 flex justify-end space-x-3">
                    <Button onClick={addQubit} size="icon" className="size-8"><Plus/></Button>
                    <Button onClick={deleteLastQubit} size="icon" className="size-8" variant="destructive"><Minus/></Button>
                    <Button onClick={() => resetCircuit()} size="icon" className="size-8" variant="destructive"><Trash/></Button>
                </div>

                {/* Circuit Canvas */}
                <div className="relative flex-1 overflow-auto">

                    {/* Wires & Labels */}
                    {flatQubits.map((q, i) => (
                        <div
                            key={`wire-${q.regName}-${q.qubitIdx}`}
                            className="absolute left-0 right-0"
                            style={{ top: i * QUBIT_HEIGHT, height: QUBIT_HEIGHT }}
                        >
                            <div
                                className="absolute left-2 flex items-center font-mono text-[12px]"
                                style={{ height: QUBIT_HEIGHT, width: '60px' }}
                            >
                                {q.regName}[{q.qubitIdx}]
                            </div>
                            <div
                                className="absolute border-b"
                                style={{
                                    top: QUBIT_HEIGHT / 2,
                                    left: '64px',
                                    right: 0,
                                    height: '1px'
                                }}
                            />
                        </div>
                    ))}

                    {/* Circuit Content Container (Offset for labels) */}
                    <div className="absolute inset-y-0 right-0" style={{ left: '64px' }}>

                        {/* Quantum Operations */}
                        <div className={`absolute inset-0 z-20 ${isGateDragging ? 'pointer-events-none' : ''}`}>
                            {circuit?.layers.map((layer, layerIdx) => (
                                layer.quantumOperations.map((op) => (
                                    <ElementaryQuantumGate
                                        key={op.id}
                                        operation={op}
                                        registers={circuit.registers}
                                        layerIdx={layerIdx}
                                        isDragging={op.id === draggingOperationId}
                                        setDraggingGateSize={setDraggingGateSize}
                                        onDragStart={() => {
                                            setIsGateDragging(true);
                                            setDraggingOperationId(op.id!);
                                        }}
                                        onDragEnd={() => {
                                            setHoverPos(null);
                                            setShiftedOperations({});
                                            setDraggingOperationId(null);
                                            setIsGateDragging(false);
                                        }}
                                        onDelete={() => removeQuantumOperation(op.id!)}
                                        shiftedOffset={shiftedOperations[op.id!] ?? 0}
                                    />
                                ))
                            ))}
                        </div>

                        {/* 3. Drop Zone Grid */}
                        <div className="absolute inset-0 z-10">
                            {flatQubits.map((qubit, qIdx) => (
                                Array.from({ length: (circuit?.layers.length ?? 0) + 1 }).map((_, layerIdx) => {
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
                                                height: QUBIT_HEIGHT
                                            }}
                                            onDragOver={(e) => handleDragOver(e, qIdx, layerIdx)}
                                            onDragLeave={() => {
                                                setHoverPos(null);
                                                setShiftedOperations({});
                                            }}
                                            onDrop={(e) => handleDrop(e, qubit.regId, qubit.qubitIdx, layerIdx)}
                                        />
                                    );
                                })
                            ))}
                        </div>

                        {/* 4. Drop Placeholder (Visual Feedback) */}
                        {hoverPos && (
                            <div
                                className="absolute border-2 border-dashed pointer-events-none z-50 border-primary/50 bg-primary/10"
                                style={{
                                    left: hoverPos.layerIdx * CELL_WIDTH,
                                    top: hoverPos.qubitIdx * QUBIT_HEIGHT,
                                    width: CELL_WIDTH,
                                    height: draggingGateSize * QUBIT_HEIGHT
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Gate Layer Indexing (Footer) */}
                <div className={`${styles.gateIndexSpacing} flex font-mono text-sm border-l border-gray-500`}>
                    {Array.from({ length: circuit?.layers.length ?? 0 }, (_, i) => (
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