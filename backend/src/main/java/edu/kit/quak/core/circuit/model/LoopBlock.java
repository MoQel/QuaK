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
 * bounding box contains exactly its members. Nothing enforces that yet — the scheduler still has to
 * learn to reserve a block's rectangle.
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
