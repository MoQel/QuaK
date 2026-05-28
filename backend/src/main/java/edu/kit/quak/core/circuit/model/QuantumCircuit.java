package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.exceptions.InvalidRegisterTypeException;
import edu.kit.quak.core.circuit.exceptions.OperationNotFoundException;
import edu.kit.quak.core.circuit.exceptions.RegisterNotFoundException;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.ClassicRegister;
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

    private final List<Register> registers = new ArrayList<>();
    private final List<Layer> layers = new ArrayList<>();

    public QuantumCircuit(String projectId) {
        super();
        this.projectId = projectId;
        registers.add(new QuantumRegister("q", 4));
    }

    @Builder
    public QuantumCircuit(String id, String projectId, List<Register> registers, List<Layer> layers) {
        super();
        this.id = id;
        this.projectId = projectId;
        this.registers.addAll(registers);
        this.layers.addAll(layers);
    }

    public List<Register> getRegisters() {
        return Collections.unmodifiableList(registers);
    }

    public List<Layer> getLayers() {
        return Collections.unmodifiableList(layers);
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
                    .anyMatch(selector -> selector.getRegisterId().equals(registerId) && selector.getIndex() == qubitIdx);
                if (removeOperation) {
                    layer.removeQuantumOperation(operation);
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

    /**
     * Adds a new register to the circuit.
     *
     * @param register the register to add (QuantumRegister or ClassicRegister)
     */
    public void addRegister(@NonNull Register register) {
        registers.add(register);
    }

    /**
     * Deletes a register from the circuit, removing all operations that reference
     * any qubit or classic bit within the deleted register.
     *
     * @param registerId the ID of the register to delete
     * @throws RegisterNotFoundException if no register with the given ID exists
     */
    public void deleteRegister(@NonNull String registerId) {
        Register register = findRegisterById(registerId);

        // Remove all operations that reference qubits or classic bits of this register.
        for (Layer layer : layers) {
            for (QuantumOperation operation : new ArrayList<>(layer.getQuantumOperations())) {
                boolean referencesDeletedRegister = Stream.concat(
                    operation.getTargetQubits().stream(),
                    Stream.concat(
                        operation.getControlQubits() != null ? operation.getControlQubits().stream() : Stream.empty(),
                        operation instanceof Measurement m ? m.getClassicBits().stream() : Stream.empty()
                    )
                ).anyMatch(sel -> sel.getRegisterId().equals(registerId));

                if (referencesDeletedRegister) {
                    layer.removeQuantumOperation(operation);
                }
            }
        }

        registers.remove(register);
        flushLayers();
    }

    /**
     * Adds a classic bit to the specified ClassicRegister.
     *
     * @param registerId the ID of the ClassicRegister
     * @throws RegisterNotFoundException  if no register with the given ID exists
     * @throws InvalidRegisterTypeException if the register is not a ClassicRegister
     */
    public void addClassicBit(@NonNull String registerId) {
        ClassicRegister classicRegister = findClassicRegisterById(registerId);
        classicRegister.addBit();
    }

    /**
     * Removes a classic bit from the specified ClassicRegister. All operations
     * targeting the bit are removed, and indices of subsequent bits are decremented.
     *
     * @param registerId the ID of the ClassicRegister
     * @param bitIdx     the index of the bit to remove
     * @throws RegisterNotFoundException   if no register with the given ID exists
     * @throws InvalidRegisterTypeException if the register is not a ClassicRegister
     * @throws RequestedIndexOutOfBounds    if bitIdx is out of range
     */
    public void removeClassicBit(@NonNull String registerId, int bitIdx) {
        ClassicRegister classicRegister = findClassicRegisterById(registerId);

        if (bitIdx < 0 || bitIdx >= classicRegister.getNumberOfBits()) {
            throw new RequestedIndexOutOfBounds("ClassicBit", bitIdx, classicRegister.getNumberOfBits());
        }

        classicRegister.removeBit();

        for (Layer layer : layers) {
            for (QuantumOperation operation : new ArrayList<>(layer.getQuantumOperations())) {
                if (operation instanceof Measurement m) {
                    List<ElementSelector> classicBits = m.getClassicBits();

                    // Remove operations that target this exact bit.
                    boolean targetsRemovedBit = classicBits
                        .stream()
                        .anyMatch(sel -> sel.getRegisterId().equals(registerId) && sel.getIndex() == bitIdx);
                    if (targetsRemovedBit) {
                        layer.removeQuantumOperation(operation);
                        continue;
                    }

                    // Decrement indices for bits after the removed one.
                    classicBits
                        .stream()
                        .filter(sel -> sel.getRegisterId().equals(registerId) && sel.getIndex() > bitIdx)
                        .forEach(sel -> sel.setIndex(sel.getIndex() - 1));
                }
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
                    rescheduleOperations();
                    return;
                }
            }
        }
        throw new OperationNotFoundException(operationId);
    }

    /**
     * Re-calculates the position of all operations to ensure they are positioned as far left
     * as possible (ASAP scheduling) while respecting qubit collisions and preserving
     * logical dependency barriers.
     */
    private void rescheduleOperations() {
        // 1. Extract all operations in their original relative order
        List<QuantumOperation> allOps = layers
            .stream()
            .flatMap(l -> l.getQuantumOperations().stream())
            .toList();

        // 2. Clear current layers
        layers.forEach(Layer::clearQuantumOperations);

        // Track the last occupied layer index for each specific qubit.
        // Key: Selector that points to the qubit, Value: Last occupied layer index
        Map<ElementSelector, Integer> lastLayerPerQubit = new HashMap<>();

        // 3. Re-insert the operations into the first possible layer where it fits
        // while respecting the "last occupied layer" logic
        for (QuantumOperation op : allOps) {
            Set<ElementSelector> involvedQubits = getTargetAndControlQubits(op);

            // Find the earliest possible layer where this operation could be placed
            // using the maximal last occupied layer index of the affected qubits as the baseline.
            int minLayerIdx = 0;
            for (ElementSelector s : involvedQubits) {
                minLayerIdx = Math.max(minLayerIdx, lastLayerPerQubit.getOrDefault(s, -1));
            }

            // Search for the first layer (starting from minLayerIdx) that has no collision.
            int layerIdx = minLayerIdx;
            while (isQubitCollisionInLayer(op, layerIdx)) {
                layerIdx++;
            }

            // Ensure layer exists
            while (layers.size() <= layerIdx) {
                layers.add(new Layer(new ArrayList<>()));
            }

            op.generateNewId(); // Generate new ID because of problems with Hibernate.
            layers.get(layerIdx).addQuantumOperation(op); // Add operation to target layer

            // Update the last occupied layer index for all involved qubits
            for (ElementSelector s : involvedQubits) {
                lastLayerPerQubit.put(s, layerIdx);
            }
        }

        flushLayers();
    }

    /**
     * Checks if a quantum operation conflicts with existing operations in a specific layer.
     *
     * @param op The quantum operation to check for potential collisions.
     * @param layerIdx The index of the layer to inspect.
     * @return {@code true} if a qubit overlap is detected.
     */
    private boolean isQubitCollisionInLayer(QuantumOperation op, int layerIdx) {
        if (layerIdx >= layers.size()) return false;

        Set<ElementSelector> requiredQubits = getTargetAndControlQubits(op);

        return layers
            .get(layerIdx)
            .getQuantumOperations()
            .stream()
            .map(this::getTargetAndControlQubits)
            .anyMatch(existingQubits -> !Collections.disjoint(requiredQubits, existingQubits));
    }

    private Set<ElementSelector> getTargetAndControlQubits(QuantumOperation op) {
        Stream<ElementSelector> targetStream = op.getTargetQubits().stream();
        Stream<ElementSelector> controlStream = op.getControlQubits() != null ? op.getControlQubits().stream() : Stream.empty();

        return Stream.concat(targetStream, controlStream).collect(Collectors.toSet());
    }

    private void flushLayers() {
        // Remove all layers that no longer contain any quantum operations.
        layers.removeIf(layer -> layer.getQuantumOperations().isEmpty());
    }

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

    private ClassicRegister findClassicRegisterById(String classicRegisterId) {
        for (Register register : registers) {
            if (register.getId().equals(classicRegisterId)) {
                Optional<ClassicRegister> classicRegister = register.asClassic();
                if (classicRegister.isEmpty()) {
                    throw new InvalidRegisterTypeException(classicRegisterId);
                }
                return classicRegister.get();
            }
        }
        throw new RegisterNotFoundException(classicRegisterId);
    }

    private Register findRegisterById(String registerId) {
        for (Register register : registers) {
            if (register.getId().equals(registerId)) {
                return register;
            }
        }
        throw new RegisterNotFoundException(registerId);
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
