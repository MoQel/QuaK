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
        System.out.println(this.toCode());
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

    public String toCode() {
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append(this.projectId);
        for (Register register : registers) {
            if (register instanceof QuantumRegister quantumRegister) {
                stringBuilder.append("// Register ").append(quantumRegister.getName()).append("\n");
                stringBuilder
                    .append("qubit[")
                    .append(quantumRegister.getNumberOfQubits())
                    .append("] ")
                    .append(quantumRegister.getName())
                    .append(";\n");
            }
            // TODO classical register?
        }
        stringBuilder.append("\n");

        for (Layer layer : layers) {
            stringBuilder.append("// Layer ").append(layer.id).append("\n");
            stringBuilder.append(layer.toCode(this)).append("\n");
        }
        return stringBuilder.toString();
    }
}
