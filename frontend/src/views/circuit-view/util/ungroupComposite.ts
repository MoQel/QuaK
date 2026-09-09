import { CircuitResponse, CompositeQuantumGateDto, isCompositeGate } from '@/api/dto/circuit.ts';
import { withFreshIds } from '@/lib/operationIds.ts';

type Layers = CircuitResponse['layers'];

const copyLayer = (layer: Layers[number]): Layers[number] => ({ quantumOperations: [...layer.quantumOperations] });

/** The composite with the given id together with its layer, or null if the id names something else. */
const findComposite = (
    layers: Layers,
    operationId: string,
): { layerIdx: number; gate: CompositeQuantumGateDto } | null => {
    for (const [layerIdx, layer] of layers.entries()) {
        const operation = layer.quantumOperations.find((candidate) => candidate.id === operationId);
        if (operation) return isCompositeGate(operation) ? { layerIdx, gate: operation } : null;
    }
    return null;
};

/**
 * Replaces a composite gate by the operations it is made of — the editor's "Ungroup".
 *
 * The DTO's `body` is the gate expanded **one level** and already bound to this call's qubits, so
 * nothing has to be re-derived: a nested gate stays a box, and dropping the body into the circuit is
 * enough. The body is a statement sequence, not a layout, so every operation gets its **own layer**,
 * spliced in where the box stood. That is not cosmetic: both schedulers order the operations of a
 * single layer by their topmost qubit, so putting the whole body into one layer would silently
 * reorder it — `gate g a, b { h b; cx a, b; }` would come out as `cx` before `h`. With one operation
 * per layer the relative order is fixed, and the ASAP scheduler compacts the columns back on render.
 *
 * A gate with an empty body simply disappears, which is what ungrouping nothing amounts to.
 *
 * @param operationId the composite to dissolve; anything else leaves the layers untouched
 */
export const ungroupComposite = (layers: Layers, operationId: string): Layers => {
    const found = findComposite(layers, operationId);
    if (!found) return layers;

    const { layerIdx, gate } = found;

    // Everything left of the box is unaffected; its own layer keeps whatever else stood in it.
    const rebuilt: Layers = layers.slice(0, layerIdx).map(copyLayer);
    rebuilt.push({ quantumOperations: layers[layerIdx].quantumOperations.filter((op) => op.id !== operationId) });

    (gate.body ?? []).forEach((operation, position) => {
        const targetIdx = layerIdx + position;
        while (rebuilt.length <= targetIdx) rebuilt.push({ quantumOperations: [] });
        rebuilt[targetIdx].quantumOperations.push(withFreshIds(operation));
    });

    // Appended after the inserted layers, so everything that came after the box still does.
    rebuilt.push(...layers.slice(layerIdx + 1).map(copyLayer));

    return rebuilt.filter((layer) => layer.quantumOperations.length > 0);
};
