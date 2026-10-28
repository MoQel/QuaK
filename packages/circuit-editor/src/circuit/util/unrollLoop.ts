import { CircuitResponse, LoopBlockDto, QuantumOperationDto, isStrictlyInside } from '@quak/circuit-core';
import { withFreshIds } from '#operationIds.ts';

type Layers = CircuitResponse['layers'];

const copyLayer = (layer: Layers[number]): Layers[number] => ({ quantumOperations: [...layer.quantumOperations] });

/** One written-out repetition of a frame's body, plus what each member's copy is called. */
type Pass = {
    layers: QuantumOperationDto[][];
    copyOf: Map<string, string>;
};

/**
 * Writes a repetition frame out in full: the body stands there `repeatCount` times and the frame is
 * gone — the editor's "Unroll", the inverse of what the parser does when it collapses a `for` whose
 * passes all came out alike.
 *
 * What the circuit computes does not change, which is what separates this from removing a frame:
 * that drops the annotation and lets the body run once. Here the extra passes become ordinary gates
 * the user can then edit one by one, so a loop can be opened up when only one of its rounds should
 * differ.
 *
 * <p>The first pass is left exactly where it is — its operations keep their ids, so a selection or
 * another frame naming them still means the same gates. Only the extra passes are new, under
 * recursively fresh ids ({@link withFreshIds}): duplicating an id would make two operations in one
 * circuit claim the same stored row.
 *
 * <p>The body's own layering is repeated rather than flattened, so operations that shared a column
 * still do; ASAP compacts the columns again on render. The copies are spliced in directly behind the
 * body's last layer, which keeps everything that ran after the loop running after it.
 *
 * @param loopBlockId the frame to write out; an unknown id leaves the circuit untouched
 */
export const unrollLoop = (circuit: CircuitResponse, loopBlockId: string): CircuitResponse => {
    const blocks = circuit.loopBlocks ?? [];
    const block = blocks.find((candidate) => candidate.id === loopBlockId);
    if (!block) return circuit;

    const members = new Set(block.operationIds);
    const bodyLayers = circuit.layers.map((layer) =>
        layer.quantumOperations.filter((operation) => operation.id !== undefined && members.has(operation.id)),
    );
    const lastBodyLayer = bodyLayers.findLastIndex((operations) => operations.length > 0);

    const withoutFrame = { ...circuit, loopBlocks: blocks.filter((candidate) => candidate.id !== block.id) };
    // A single pass is already written out, and a frame over nothing this circuit holds has no body
    // to repeat; either way dropping the frame is the whole of it.
    if (block.repeatCount < 2 || lastBodyLayer < 0) return withoutFrame;

    const extraPasses = Array.from({ length: block.repeatCount - 1 }, () => copyBody(bodyLayers));

    return {
        ...circuit,
        layers: rebuildLayers(circuit.layers, lastBodyLayer, extraPasses),
        loopBlocks: withoutFrame.loopBlocks.flatMap((other) => rewriteFrame(other, block, extraPasses)),
    };
};

/** A fresh repetition of the body, remembering which copy stands for which original. */
const copyBody = (bodyLayers: QuantumOperationDto[][]): Pass => {
    const copyOf = new Map<string, string>();
    const layers = bodyLayers.map((operations) =>
        operations.map((operation) => {
            const copy = withFreshIds(operation);
            copyOf.set(operation.id!, copy.id!);
            return copy;
        }),
    );
    return { layers, copyOf };
};

/** The circuit's layers with the extra passes spliced in behind the body's last layer. */
const rebuildLayers = (layers: Layers, lastBodyLayer: number, extraPasses: Pass[]): Layers => {
    const rebuilt: Layers = layers.slice(0, lastBodyLayer + 1).map(copyLayer);

    for (const pass of extraPasses) {
        for (const operations of pass.layers) {
            if (operations.length > 0) rebuilt.push({ quantumOperations: operations });
        }
    }

    rebuilt.push(...layers.slice(lastBodyLayer + 1).map(copyLayer));
    return rebuilt;
};

/**
 * What another frame becomes once `block` is written out. Frames nest or are disjoint, so there are
 * only three cases, and each has exactly one honest answer:
 *
 * <ul>
 *   <li>inside the unrolled one — every pass gets its own copy of it, so `for i { for j { … } }`
 *       becomes two inner loops rather than one that only wraps the first pass;
 *   <li>around it (or over exactly the same operations, which cannot be told apart from around and
 *       does not have to be) — it takes the copies in as members, so its own count still multiplies
 *       the unrolled body in full;
 *   <li>disjoint — untouched.
 * </ul>
 */
const rewriteFrame = (frame: LoopBlockDto, block: LoopBlockDto, extraPasses: Pass[]): LoopBlockDto[] => {
    if (isStrictlyInside(frame, block)) return [frame, ...extraPasses.map((pass) => repeatFrame(frame, pass))];

    const enclosesBlock = block.operationIds.every((id) => frame.operationIds.includes(id));
    return enclosesBlock ? [adoptCopies(frame, block, extraPasses)] : [frame];
};

/** The same frame over one pass's copies, under its own id — two frames may not share one. */
const repeatFrame = (frame: LoopBlockDto, pass: Pass): LoopBlockDto => ({
    id: crypto.randomUUID(),
    repeatCount: frame.repeatCount,
    operationIds: mapToCopies(frame.operationIds, pass),
});

/**
 * An enclosing frame extended by the copies, which go in right behind the last member it already
 * had, so its members stay in program order — that is what code generation writes inside the `for`.
 */
const adoptCopies = (frame: LoopBlockDto, block: LoopBlockDto, extraPasses: Pass[]): LoopBlockDto => {
    const lastMember = Math.max(...block.operationIds.map((id) => frame.operationIds.indexOf(id)));
    const copies = extraPasses.flatMap((pass) => mapToCopies(block.operationIds, pass));

    return {
        ...frame,
        operationIds: [
            ...frame.operationIds.slice(0, lastMember + 1),
            ...copies,
            ...frame.operationIds.slice(lastMember + 1),
        ],
    };
};

const mapToCopies = (operationIds: string[], pass: Pass): string[] =>
    operationIds.map((id) => pass.copyOf.get(id)).filter((id): id is string => id !== undefined);
