import { CircuitResponse, LoopBlockDto, QuantumOperationDto } from '@/api/dto/circuit.ts';

/**
 * The frames to treat as one unit when this operation comes up: the widest ones covering it.
 *
 * Taking the outermost is what makes nesting fall out of the recursion — inner frames are handled
 * one level down, over the members of the loop around them.
 *
 * It returns a list because two loops can end up covering *exactly* the same operations:
 * `for i in [0:1] { for j in [0:2] { h q[0]; } }` collapses to one H with a ×2 and a ×3 frame on it.
 * Member sets alone cannot say which of those is the inner one — and they do not have to, since the
 * body runs 2·3 times either way. Picking just one would silently drop a factor.
 */
export const outermostBlocksCovering = (blocks: LoopBlockDto[], operationId: string): LoopBlockDto[] => {
    const covering = blocks.filter((block) => block.operationIds.includes(operationId));
    if (covering.length === 0) return [];

    // Frames nest or are disjoint, never partially overlap, so equal size here means equal members.
    const widest = Math.max(...covering.map((block) => block.operationIds.length));
    return covering.filter((block) => block.operationIds.length === widest);
};

/**
 * The frame drawn closest around this operation, or undefined when it is in none.
 *
 * The mirror image of {@link outermostBlocksCovering}, and what a per-gate "remove this loop" acts
 * on: the innermost box is the one the user sees hugging the gate. Frames covering exactly the same
 * operations are ordered by their position in the list, matching how `loopFrames.nestingDepth`
 * staggers them on screen, so the one that *looks* innermost is the one that goes.
 */
export const innermostBlockCovering = (blocks: LoopBlockDto[], operationId: string): LoopBlockDto | undefined => {
    const covering = blocks.filter((block) => block.operationIds.includes(operationId));
    if (covering.length === 0) return undefined;

    const tightest = Math.min(...covering.map((block) => block.operationIds.length));
    const candidates = covering.filter((block) => block.operationIds.length === tightest);
    return candidates[candidates.length - 1];
};

/**
 * Whether one frame sits strictly inside another. Equal member sets do not nest — which is also what
 * stops the recursion when two loops end up covering exactly the same operations.
 */
export const isStrictlyInside = (candidate: LoopBlockDto, block: LoopBlockDto): boolean =>
    candidate.id !== block.id &&
    candidate.operationIds.length < block.operationIds.length &&
    candidate.operationIds.every((id) => block.operationIds.includes(id));

/**
 * The circuit's operations in execution order, with every repetition frame's body repeated.
 *
 * This is what a loop *means*, and it is why anything that runs a circuit has to know about frames:
 * reading the layers left to right yields the body once, so a consumer that ignores the frames
 * silently computes a different circuit — with no visible symptom, since the editor still shows the
 * loop correctly. Nested frames are expanded from the inside out by the same routine.
 *
 * Operations in the same column never overlap on the wires, so their relative order does not matter;
 * only the order along a wire does, and that is preserved.
 */
export const toExecutionOrder = (circuit: CircuitResponse): QuantumOperationDto[] => {
    const operations = circuit.layers.flatMap((layer) => layer.quantumOperations).filter((op) => op.type !== 'DUMMY');
    return expand(operations, circuit.loopBlocks ?? []);
};

const expand = (operations: QuantumOperationDto[], blocks: LoopBlockDto[]): QuantumOperationDto[] => {
    const byId = new Map(operations.map((op) => [op.id, op]));
    const consumed = new Set<string | undefined>();
    const result: QuantumOperationDto[] = [];

    for (const operation of operations) {
        if (consumed.has(operation.id)) continue;

        const outermost = operation.id ? outermostBlocksCovering(blocks, operation.id) : [];
        const block = outermost[0];
        if (!block) {
            result.push(operation);
            consumed.add(operation.id);
            continue;
        }

        const members = block.operationIds
            .map((id) => byId.get(id))
            .filter((member): member is QuantumOperationDto => !!member);
        const onePass = expand(
            members,
            blocks.filter((candidate) => isStrictlyInside(candidate, block)),
        );
        // Frames over the very same operations are all in force at once, so their counts multiply.
        const passes = outermost.reduce((product, frame) => product * frame.repeatCount, 1);
        for (let pass = 0; pass < passes; pass++) {
            result.push(...onePass);
        }
        members.forEach((member) => consumed.add(member.id));
    }

    return result;
};
