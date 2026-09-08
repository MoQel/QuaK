package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;

/**
 * A run of operations that is executed several times — the {@code for i in [0:3] { … }} the editor
 * draws as a frame around its body with a {@code ×4} badge.
 *
 * <h2>Why this is not a {@link edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation}</h2>
 *
 * A composite gate is one operation that <em>hides</em> its contents. A loop is the opposite: its
 * body stays visible and individually editable, and the loop is only an annotation on top. Putting
 * it into a layer would swallow exactly the operations that are supposed to remain visible, so a
 * block sits beside the layers on the circuit instead.
 *
 * <h2>Why members are ids, not a rectangle</h2>
 *
 * The obvious alternative — storing the covered layer and qubit range — goes stale on the first
 * edit, because ASAP scheduling re-lays out the circuit constantly. Holding the member <em>ids</em>
 * instead lets the drawn frame be derived as the bounding box of wherever those operations
 * currently sit, so it follows the scheduler rather than fighting it. Operation ids are
 * client-generated and stable across saves, which is what makes them usable as an anchor.
 *
 * <p>Consequence for anyone rendering or simulating this: the frame is only honest while its
 * bounding box contains exactly its members. {@code QuantumCircuit.layOutColumns} is what keeps it
 * that way, by placing a block as a unit and reserving its rectangle against everything else.
 */
public class LoopBlock extends ElementWithId {

    /** How often the body runs. Always at least 2 — a single pass is not a repetition. */
    @Getter
    private final int repeatCount;

    private final List<String> operationIds;

    public LoopBlock(int repeatCount, @NonNull List<String> operationIds) {
        super();
        if (repeatCount < 2) {
            throw new InvalidOperationConfigurationException(
                "A loop block repeats its body at least twice, but got %d.".formatted(repeatCount)
            );
        }
        if (operationIds.isEmpty()) {
            throw new InvalidOperationConfigurationException("A loop block must cover at least one operation.");
        }
        if (new HashSet<>(operationIds).size() != operationIds.size()) {
            throw new InvalidOperationConfigurationException("A loop block lists the same operation more than once.");
        }
        this.repeatCount = repeatCount;
        this.operationIds = new ArrayList<>(operationIds);
    }

    /** The operations the frame encloses, in program order. */
    public List<String> getOperationIds() {
        return Collections.unmodifiableList(operationIds);
    }

    public boolean covers(@NonNull String operationId) {
        return operationIds.contains(operationId);
    }

    /**
     * The frames to treat as one unit at this operation: the widest ones covering it.
     *
     * <p>Taking the outermost is what lets nesting be handled by recursion — the inner frames are
     * dealt with one level down, over the members of the loop around them.
     *
     * <p>A list rather than a single block, because two loops can cover <em>exactly</em> the same
     * operations: {@code for i in [0:1] { for j in [0:2] { h q[0]; } }} collapses to one H carrying a
     * ×2 and a ×3 frame. Member sets cannot say which of those is the inner one, and they need not —
     * the body runs 2·3 times either way. Whoever cares about the count must use all of them.
     */
    public static List<LoopBlock> outermostCovering(@NonNull List<LoopBlock> blocks, @NonNull String operationId) {
        List<LoopBlock> covering = blocks
            .stream()
            .filter(block -> block.covers(operationId))
            .toList();
        if (covering.isEmpty()) {
            return List.of();
        }
        // Frames nest or are disjoint, never partially overlap, so equal size means equal members.
        int widest = covering
            .stream()
            .mapToInt(block -> block.operationIds.size())
            .max()
            .orElseThrow();
        return covering
            .stream()
            .filter(block -> block.operationIds.size() == widest)
            .toList();
    }

    /**
     * Whether this frame sits strictly inside the given one. Equal member sets do not nest, which is
     * also what stops the recursion when two loops cover exactly the same operations.
     */
    public boolean isStrictlyInside(@NonNull LoopBlock other) {
        return this != other && operationIds.size() < other.operationIds.size() && other.operationIds.containsAll(operationIds);
    }

    /**
     * Drops an operation that no longer exists from this block.
     *
     * @return whether the block is now empty and should be dropped with it
     */
    public boolean removeOperation(@NonNull String operationId) {
        operationIds.remove(operationId);
        return operationIds.isEmpty();
    }

    @Override
    public String toString() {
        return String.format("[LoopBlock: x%d over %d operation(s) (loopBlockId=%s)]", repeatCount, operationIds.size(), getId());
    }
}
