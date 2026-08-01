package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.exceptions.InvalidRegisterTypeException;
import edu.kit.quak.core.circuit.exceptions.OperationNotFoundException;
import edu.kit.quak.core.circuit.exceptions.RegisterNotFoundException;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.core.common.exception.RequestedIndexOutOfBounds;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;

public class QuantumCircuit extends ElementWithId {

    @Getter
    private final String projectId;

    /**
     * Link to the file this circuit belongs to. Persisted circuits are always file-linked;
     * only transient circuits (e.g. built for code generation) may have none.
     */
    @Getter
    private final String fileId;

    private final List<Register> registers = new ArrayList<>();
    private final List<Layer> layers = new ArrayList<>();

    /**
     * Repetition frames drawn around parts of the circuit. They sit beside the layers rather than
     * in them, because a loop's body stays visible and editable; see {@link LoopBlock}.
     */
    private final List<LoopBlock> loopBlocks = new ArrayList<>();

    public QuantumCircuit(String projectId, String fileId) {
        super();
        this.projectId = projectId;
        this.fileId = fileId;
        registers.add(new QuantumRegister("q", 4));
    }

    @Builder
    public QuantumCircuit(
        String id,
        String projectId,
        String fileId,
        List<Register> registers,
        List<Layer> layers,
        List<LoopBlock> loopBlocks
    ) {
        super();
        this.id = id;
        this.projectId = projectId;
        this.fileId = fileId;
        this.registers.addAll(registers);
        this.layers.addAll(layers);
        if (loopBlocks != null) {
            this.loopBlocks.addAll(loopBlocks);
        }
    }

    public List<Register> getRegisters() {
        return Collections.unmodifiableList(registers);
    }

    /** Adds a register to the circuit, e.g. when materializing a register declaration parsed from code. */
    public void addRegister(@NonNull Register register) {
        registers.add(register);
    }

    public List<Layer> getLayers() {
        return Collections.unmodifiableList(layers);
    }

    public List<LoopBlock> getLoopBlocks() {
        return Collections.unmodifiableList(loopBlocks);
    }

    /**
     * Adds a repetition frame over operations that are already part of this circuit.
     *
     * <p>Membership is checked here rather than trusted: a block naming an operation the circuit
     * does not contain would draw a frame around nothing and, worse, make code generation repeat a
     * body that is not there.
     */
    public void addLoopBlock(@NonNull LoopBlock loopBlock) {
        Set<String> known = allOperations().map(QuantumOperation::getId).collect(Collectors.toSet());
        List<String> unknown = loopBlock
            .getOperationIds()
            .stream()
            .filter(id -> !known.contains(id))
            .toList();
        if (!unknown.isEmpty()) {
            throw new InvalidOperationConfigurationException("Loop block covers operations that are not in this circuit: " + unknown);
        }
        loopBlocks.add(loopBlock);
        // A frame constrains the layout — it has to keep its rectangle to itself — so the columns
        // have to be worked out again, exactly as when an operation is added.
        rescheduleOperations();
    }

    private Stream<QuantumOperation> allOperations() {
        return layers.stream().flatMap(layer -> layer.getQuantumOperations().stream());
    }

    /** Drops the operation from every frame that covered it, and any frame left empty. */
    private void detachFromLoopBlocks(String operationId) {
        loopBlocks.removeIf(block -> block.covers(operationId) && block.removeOperation(operationId));
    }

    /**
     * Sucht ein Register anhand seines Namens.
     *
     * @param registerName Der Name des gesuchten Registers (z.B. "q" oder "alice").
     * @return Ein Optional, das das Register enthält, oder ein leeres Optional, wenn keines gefunden wurde.
     */
    public Optional<Register> getRegisterByName(@NonNull String registerName) {
        return registers
            .stream()
            .filter(register -> registerName.equals(register.getName()))
            .findFirst();
    }

    public void addQubit(@NonNull String registerId) {
        QuantumRegister quantumRegister = findQuantumRegisterById(registerId);
        quantumRegister.addQubit();
    }

    public void removeQubit(@NonNull String registerId, int qubitIdx) {
        QuantumRegister quantumRegister = findQuantumRegisterById(registerId);

        if (qubitIdx < 0 || qubitIdx >= quantumRegister.getNumberOfQubits()) {
            throw new RequestedIndexOutOfBounds("Qubit", qubitIdx, quantumRegister.getNumberOfQubits());
        }

        // Remove qubit.
        quantumRegister.removeQubit();

        for (Layer layer : layers) {
            for (QuantumOperation operation : new ArrayList<>(layer.getQuantumOperations())) {
                List<ElementSelector> selectors = Stream.of(operation.getTargetQubits(), operation.getControlQubits())
                    .flatMap(Collection::stream)
                    .toList();

                // Remove all quantum operations that had this qubit either as target or as control.
                boolean removeOperation = selectors
                    .stream()
                    .anyMatch(selector -> selector.getRegisterId().equals(registers.getFirst().getId()) && selector.getIndex() == qubitIdx);
                if (removeOperation) {
                    layer.removeQuantumOperation(operation);
                    detachFromLoopBlocks(operation.getId());
                    continue;
                }

                // Update selector indices. Decrease index by 1 to account for the removal of the qubit.
                selectors
                    .stream()
                    .filter(sel -> sel.getRegisterId().equals(registerId) && sel.getIndex() > qubitIdx)
                    .forEach(ElementSelector::decreaseIndex);
            }
        }

        flushLayers();
    }

    public void addQuantumOperation(@NonNull QuantumOperation operation, int layerIdx) {
        if (layerIdx < 0 || layerIdx > layers.size()) {
            throw new RequestedIndexOutOfBounds("Layer", layerIdx, layers.size());
        }

        if (layerIdx == layers.size()) {
            layers.add(new Layer(List.of(operation)));
        } else {
            layers.get(layerIdx).addQuantumOperation(operation);
        }

        rescheduleOperations();
    }

    public void moveQuantumOperation(
        @NonNull String operationId,
        int layerIdx,
        @NonNull List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits
    ) {
        if (layerIdx < 0 || layerIdx > layers.size()) {
            throw new RequestedIndexOutOfBounds("Layer", layerIdx, layers.size());
        }
        if (targetQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException("Must provide at least one qubit to target.");
        }

        for (int idx = 0; idx < layers.size(); idx++) {
            // 'for' loop CANNOT be replaced with enhanced 'for'
            for (QuantumOperation operation : layers.get(idx).getQuantumOperations()) {
                if (operation.getId().equals(operationId)) {
                    // Set new target and control qubits.
                    operation.setTargetQubits(targetQubits);
                    operation.setControlQubits(controlQubits);

                    // Move operation to new layer.
                    layers.get(idx).removeQuantumOperation(operation);
                    rescheduleOperations();
                    addQuantumOperation(operation, layerIdx); // Add and reorganize again.
                    break;
                }
            }
        }
    }

    public void removeQuantumOperation(String operationId) {
        for (Layer layer : layers) {
            for (QuantumOperation operation : layer.getQuantumOperations()) {
                if (operation.getId().equals(operationId)) {
                    layer.removeQuantumOperation(operation);
                    detachFromLoopBlocks(operationId);
                    rescheduleOperations();
                    return;
                }
            }
        }
        throw new OperationNotFoundException(operationId);
    }

    /**
     * Removes several operations at once, rescheduling only afterwards.
     *
     * <p>Exists for the QASM parser, which unrolls a loop, notices the iterations are identical and
     * then has to drop all but the first — doing that one by one would re-run ASAP scheduling over
     * the whole circuit per discarded operation. Unknown ids are ignored, so a caller may pass a set
     * it collected earlier without re-checking what is still there.
     */
    public void removeQuantumOperations(@NonNull Collection<String> operationIds) {
        if (operationIds.isEmpty()) {
            return;
        }
        Set<String> doomed = Set.copyOf(operationIds);
        for (Layer layer : layers) {
            for (QuantumOperation operation : new ArrayList<>(layer.getQuantumOperations())) {
                if (doomed.contains(operation.getId())) {
                    layer.removeQuantumOperation(operation);
                }
            }
        }
        doomed.forEach(this::detachFromLoopBlocks);
        rescheduleOperations();
    }

    /** Removes repetition frames by id, e.g. the ones an abandoned loop iteration created. */
    public void removeLoopBlocks(@NonNull Collection<String> loopBlockIds) {
        if (loopBlockIds.isEmpty()) {
            return;
        }
        Set<String> doomed = Set.copyOf(loopBlockIds);
        loopBlocks.removeIf(block -> doomed.contains(block.getId()));
    }

    /**
     * Re-runs the ASAP layer scheduling. Exposed for code generation, which builds a transient
     * circuit from request content and must canonicalize the layering so the emitted {@code
     * // Layer N} blocks line up with the rendered columns.
     */
    public void reschedule() {
        rescheduleOperations();
    }

    /**
     * Re-calculates the position of all operations to ensure they are positioned as far left
     * as possible (ASAP scheduling) while respecting qubit collisions and preserving
     * logical dependency barriers.
     */
    private void rescheduleOperations() {
        // Operations in canonical order: original layer first, then by topmost involved qubit. This
        // mirrors the order the frontend renders with, so the stored layers (and the generated code)
        // line up with the rendered circuit columns.
        List<QuantumOperation> allOps = layers
            .stream()
            .flatMap(layer -> layer.getQuantumOperations().stream().sorted(Comparator.comparingInt(op -> operationSpan(op)[0])))
            .toList();

        List<List<QuantumOperation>> columns = layOutColumns(allOps, loopBlocks);

        layers.forEach(Layer::clearQuantumOperations);
        for (int columnIdx = 0; columnIdx < columns.size(); columnIdx++) {
            while (layers.size() <= columnIdx) {
                layers.add(new Layer(new ArrayList<>()));
            }
            columns.get(columnIdx).forEach(layers.get(columnIdx)::addQuantumOperation);
        }

        flushLayers();
    }

    /**
     * ASAP-places operations into columns, giving every loop block a column range of its own.
     *
     * <p>A block is placed as a unit rather than operation by operation, because a frame is only
     * honest while the rectangle it is drawn as — its members' wire span across the columns they
     * occupy — contains exactly those members. Left to the plain left-justified pass, an unrelated
     * gate slides into the first column a member happens to leave free on its wire, ends up inside
     * the drawn frame and is then shown as repeating although it runs once.
     *
     * <p>The members' own layout is this same routine one level down, over the blocks strictly
     * inside this one. That recursion is what makes nesting work, and it is also why the reservation
     * never has to be propagated upwards: a nested frame is enforced against its fellow members
     * where they are laid out, while the enclosing reservation already keeps everyone else out of
     * the whole rectangle.
     *
     * @param operations the operations to place, in the order they should be considered
     * @param blocks the frames that apply at this level
     * @return the operations grouped by column, leftmost first
     */
    private List<List<QuantumOperation>> layOutColumns(List<QuantumOperation> operations, List<LoopBlock> blocks) {
        List<List<QuantumOperation>> columns = new ArrayList<>();
        Map<ElementSelector, Integer> lastColumnPerQubit = new HashMap<>();
        List<int[]> reserved = new ArrayList<>();
        Set<String> placed = new HashSet<>();

        for (QuantumOperation operation : operations) {
            if (placed.contains(operation.getId())) {
                continue;
            }
            LoopBlock block = outermostBlockCovering(blocks, operation.getId());
            if (block == null) {
                placeOperation(operation, columns, lastColumnPerQubit, reserved);
                placed.add(operation.getId());
            } else {
                placeBlock(block, blocks, operations, columns, lastColumnPerQubit, reserved, placed);
            }
        }
        return columns;
    }

    /** Puts one operation in the leftmost column that is neither occupied nor inside a frame. */
    private void placeOperation(
        QuantumOperation operation,
        List<List<QuantumOperation>> columns,
        Map<ElementSelector, Integer> lastColumnPerQubit,
        List<int[]> reserved
    ) {
        int[] span = operationSpan(operation);
        int columnIdx = earliestColumn(operation, lastColumnPerQubit);
        while (isColumnBlocked(span, columnIdx, columns) || isReserved(span, columnIdx, reserved)) {
            columnIdx++;
        }
        addToColumn(columns, columnIdx, operation);
        markOccupied(operation, columnIdx, lastColumnPerQubit);
    }

    /**
     * Places a whole frame: lays its members out among themselves, then slides that rectangle right
     * until it clears everything already placed, and reserves it against everything placed later.
     */
    private void placeBlock(
        LoopBlock block,
        List<LoopBlock> blocks,
        List<QuantumOperation> operations,
        List<List<QuantumOperation>> columns,
        Map<ElementSelector, Integer> lastColumnPerQubit,
        List<int[]> reserved,
        Set<String> placed
    ) {
        Map<String, QuantumOperation> byId = operations.stream().collect(Collectors.toMap(QuantumOperation::getId, op -> op, (a, b) -> a));
        List<QuantumOperation> members = block.getOperationIds().stream().map(byId::get).filter(Objects::nonNull).toList();
        if (members.isEmpty()) {
            return;
        }

        List<LoopBlock> nested = blocks
            .stream()
            .filter(candidate -> isStrictlyInside(candidate, block))
            .toList();
        List<List<QuantumOperation>> localColumns = layOutColumns(members, nested);
        int width = localColumns.size();
        int[] blockSpan = spanOver(members);

        int start = 0;
        for (QuantumOperation member : members) {
            start = Math.max(start, earliestColumn(member, lastColumnPerQubit));
        }
        while (!rectangleIsFree(blockSpan, start, width, columns, reserved)) {
            start++;
        }

        for (int relative = 0; relative < width; relative++) {
            for (QuantumOperation member : localColumns.get(relative)) {
                addToColumn(columns, start + relative, member);
                markOccupied(member, start + relative, lastColumnPerQubit);
                placed.add(member.getId());
            }
        }
        reserved.add(new int[] { blockSpan[0], blockSpan[1], start, start + width - 1 });
    }

    /**
     * The frame to place when this operation comes up — the widest one covering it, so an outer loop
     * is laid out as a whole and its inner loops fall out of the recursion.
     */
    private static LoopBlock outermostBlockCovering(List<LoopBlock> blocks, String operationId) {
        return blocks
            .stream()
            .filter(block -> block.covers(operationId))
            .max(Comparator.comparingInt(block -> block.getOperationIds().size()))
            .orElse(null);
    }

    /** Whether one frame sits strictly inside another. Equal member sets do not nest, which is what stops the recursion. */
    private static boolean isStrictlyInside(LoopBlock candidate, LoopBlock block) {
        return (
            candidate != block &&
            candidate.getOperationIds().size() < block.getOperationIds().size() &&
            block.getOperationIds().containsAll(candidate.getOperationIds())
        );
    }

    /** Leftmost column an operation could go by its qubits alone, ignoring collisions and frames. */
    private int earliestColumn(QuantumOperation operation, Map<ElementSelector, Integer> lastColumnPerQubit) {
        int columnIdx = 0;
        for (ElementSelector selector : getTargetAndControlQubits(operation)) {
            columnIdx = Math.max(columnIdx, lastColumnPerQubit.getOrDefault(selector, -1));
        }
        return columnIdx;
    }

    private void markOccupied(QuantumOperation operation, int columnIdx, Map<ElementSelector, Integer> lastColumnPerQubit) {
        for (ElementSelector selector : getTargetAndControlQubits(operation)) {
            lastColumnPerQubit.put(selector, columnIdx);
        }
    }

    private static void addToColumn(List<List<QuantumOperation>> columns, int columnIdx, QuantumOperation operation) {
        while (columns.size() <= columnIdx) {
            columns.add(new ArrayList<>());
        }
        columns.get(columnIdx).add(operation);
    }

    /** Whether something already in this column reaches into the given span. */
    private boolean isColumnBlocked(int[] span, int columnIdx, List<List<QuantumOperation>> columns) {
        if (columnIdx >= columns.size()) {
            return false;
        }
        return columns
            .get(columnIdx)
            .stream()
            .anyMatch(existing -> spansOverlap(span, operationSpan(existing)));
    }

    /** Whether the given span at the given column falls inside a frame it is not part of. */
    private static boolean isReserved(int[] span, int columnIdx, List<int[]> reserved) {
        return reserved
            .stream()
            .anyMatch(
                rectangle ->
                    spansOverlap(span, new int[] { rectangle[0], rectangle[1] }) && columnIdx >= rectangle[2] && columnIdx <= rectangle[3]
            );
    }

    private boolean rectangleIsFree(int[] span, int start, int width, List<List<QuantumOperation>> columns, List<int[]> reserved) {
        for (int columnIdx = start; columnIdx < start + width; columnIdx++) {
            if (isColumnBlocked(span, columnIdx, columns) || isReserved(span, columnIdx, reserved)) {
                return false;
            }
        }
        return true;
    }

    /** Topmost to bottommost qubit reached by any of the given operations. */
    private int[] spanOver(List<QuantumOperation> operations) {
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;
        for (QuantumOperation operation : operations) {
            int[] span = operationSpan(operation);
            min = Math.min(min, span[0]);
            max = Math.max(max, span[1]);
        }
        return new int[] { min, max };
    }

    private Set<ElementSelector> getTargetAndControlQubits(QuantumOperation op) {
        Stream<ElementSelector> targetStream = op.getTargetQubits().stream();
        Stream<ElementSelector> controlStream = op.getControlQubits() != null ? op.getControlQubits().stream() : Stream.empty();

        return Stream.concat(targetStream, controlStream).collect(Collectors.toSet());
    }

    /**
     * Span of the global qubit indices an operation reaches, from its topmost to its bottommost
     * involved qubit (targets and controls).
     */
    private int[] operationSpan(QuantumOperation op) {
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;
        for (ElementSelector selector : getTargetAndControlQubits(op)) {
            int index = globalQubitIndex(selector);
            min = Math.min(min, index);
            max = Math.max(max, index);
        }
        return new int[] { min, max };
    }

    /**
     * Two operations may share a layer only if their spans do not overlap. An actual qubit
     * conflict is covered by this (the shared qubit lies in both spans); additionally, two
     * multi-qubit gates with crossing vertical reach are kept apart, matching how the circuit is
     * rendered (and therefore how the generated code is layered).
     */
    private static boolean spansOverlap(int[] spanA, int[] spanB) {
        return spanA[0] <= spanB[1] && spanB[0] <= spanA[1];
    }

    /** Absolute qubit index across all registers, matching the frontend's wire ordering. */
    private int globalQubitIndex(ElementSelector selector) {
        int offset = 0;
        for (Register register : registers) {
            if (register.getId().equals(selector.getRegisterId())) {
                return offset + selector.getIndex();
            }
            offset += register.asQuantum().map(QuantumRegister::getNumberOfQubits).orElse(0);
        }
        return offset + selector.getIndex();
    }

    private void flushLayers() {
        // Remove all layers that no longer contain any quantum operations.
        layers.removeIf(layer -> layer.getQuantumOperations().isEmpty());
    }

    // TODO HashMap statt ArrayList?
    private QuantumRegister findQuantumRegisterById(String quantumRegisterId) {
        for (Register register : registers) {
            if (register.getId().equals(quantumRegisterId)) {
                Optional<QuantumRegister> quantumRegister = register.asQuantum();
                if (quantumRegister.isEmpty()) {
                    throw new InvalidRegisterTypeException(quantumRegisterId);
                }
                return quantumRegister.get();
            }
        }
        throw new RegisterNotFoundException(quantumRegisterId);
    }

    public String getQuantumRegisterNameById(String quantumRegisterId) {
        QuantumRegister quantumRegister = findQuantumRegisterById(quantumRegisterId);
        return quantumRegister.getName();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("QuantumCircuit(quantumOperationId=").append(id).append(")\n");
        registers.forEach(reg -> sb.append("  ").append(reg.toString().replace("\n", "\n  ")).append("\n"));
        sb.append("\n");
        layers.forEach(lay -> sb.append("  ").append(lay.toString().replace("\n", "\n  ")).append("\n"));
        return sb.toString().trim();
    }
}
