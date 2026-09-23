import {
    CircuitResponse,
    CompositeQuantumGateDto,
    ElementSelectorDto,
    getInvolvedSelectors,
    getSelectorKey,
    LoopBlockDto,
    QuantumOperationDto,
} from '@quak/circuit-core';
import { FlatQubit } from './types.ts';

type Layers = CircuitResponse['layers'];

/**
 * Groups the specified operations in the circuit into a single CompositeQuantumGateDto.
 *
 * All operations matching operationIds are removed from their respective layers,
 * and a new composite gate with the given gateName is placed at the earliest layer index.
 * If any enclosing LoopBlocks referenced the grouped operations, their IDs are updated
 * to reference the new composite gate ID.
 */
export const groupIntoComposite = (
    circuit: CircuitResponse,
    operationIds: string[],
    gateName: string,
    flatQubits: FlatQubit[],
): CircuitResponse => {
    if (!operationIds || operationIds.length === 0) return circuit;
    const idSet = new Set(operationIds);

    // Find all matching operations in layer/program order
    const matchedOps: { op: QuantumOperationDto; layerIdx: number }[] = [];
    circuit.layers.forEach((layer, layerIdx) => {
        layer.quantumOperations.forEach((op) => {
            if (op.id && idSet.has(op.id)) {
                matchedOps.push({ op, layerIdx });
            }
        });
    });

    if (matchedOps.length === 0) return circuit;

    const earliestLayerIdx = Math.min(...matchedOps.map((m) => m.layerIdx));

    // Map selector key to visual order
    const visualOrderMap = new Map<string, number>();
    flatQubits.forEach((fq) => {
        const key = getSelectorKey({ registerId: fq.regId, index: fq.relQubitIdx });
        visualOrderMap.set(key, fq.visualY);
    });

    // Collect all involved quantum selectors across all grouped operations
    const uniqueSelectorsMap = new Map<string, ElementSelectorDto>();
    matchedOps.forEach(({ op }) => {
        getInvolvedSelectors(op).forEach((sel) => {
            const key = getSelectorKey(sel);
            if (!uniqueSelectorsMap.has(key)) {
                uniqueSelectorsMap.set(key, sel);
            }
        });
    });

    // Sort targetQubits top-to-bottom by visualY
    const targetQubits = Array.from(uniqueSelectorsMap.values()).sort((a, b) => {
        const yA = visualOrderMap.get(getSelectorKey(a)) ?? a.index;
        const yB = visualOrderMap.get(getSelectorKey(b)) ?? b.index;
        return yA - yB;
    });

    const portLabels = targetQubits.map((_, i) => `q${i}`);
    const usedQubitPositions = targetQubits.map((_, i) => i);
    const newGateId = crypto.randomUUID();

    const compositeGate: CompositeQuantumGateDto = {
        type: 'COMPOSITE_QUANTUM_GATE',
        id: newGateId,
        identifier: gateName,
        portLabels,
        usedQubitPositions,
        targetQubits,
        controlQubits: [],
        inverseForm: false,
        body: matchedOps.map((m) => m.op),
    };

    // Remove grouped operations from layers and insert compositeGate at earliestLayerIdx
    const newLayers: Layers = circuit.layers.map((layer, idx) => {
        const remaining = layer.quantumOperations.filter((op) => !op.id || !idSet.has(op.id));
        if (idx === earliestLayerIdx) {
            return { quantumOperations: [...remaining, compositeGate] };
        }
        return { quantumOperations: remaining };
    });

    // Update loop blocks: replace covered IDs with the new composite ID
    const newLoopBlocks: LoopBlockDto[] = (circuit.loopBlocks ?? []).map((block) => {
        const hasAnyGrouped = block.operationIds.some((id) => idSet.has(id));
        if (!hasAnyGrouped) return block;

        const updatedIds: string[] = [];
        let insertedNewGate = false;
        block.operationIds.forEach((id) => {
            if (idSet.has(id)) {
                if (!insertedNewGate) {
                    updatedIds.push(newGateId);
                    insertedNewGate = true;
                }
            } else {
                updatedIds.push(id);
            }
        });

        return {
            ...block,
            operationIds: updatedIds,
        };
    });

    return {
        ...circuit,
        layers: newLayers,
        loopBlocks: newLoopBlocks,
    };
};
