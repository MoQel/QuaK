package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import lombok.Builder;
import lombok.NonNull;

import java.util.*;
import java.util.stream.Stream;

public class QuantumCircuit extends ElementWithId {
    private final List<Register> registers = new ArrayList<>();
    private final List<Layer> layers = new ArrayList<>();

    public QuantumCircuit() {
        super();
        registers.add(new QuantumRegister("q", 4));
    }

    @Builder
    public QuantumCircuit(String id, List<Register> registers, List<Layer> layers) {
        super();
        this.id = id;
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
            throw new IllegalArgumentException("qubit index must be between 0 and " + (layers.size() - 1));
        }

        // Remove qubit.
        quantumRegister.removeQubit();

        // Remove all quantum operations that had this qubit either as target or as control.
        for (Layer layer : layers) {
            for (QuantumOperation operation : new ArrayList<>(layer.getQuantumOperations())) {
                List<ElementSelector> selectors = Stream.of(operation.getTargetQubits(), operation.getControlQubits())
                        .flatMap(Collection::stream)
                        .toList();

                boolean removeOperation = selectors.stream()
                        .anyMatch(selector -> selector.getRegisterId().equals(registers.getFirst().getId())
                                && selector.getIndex() == qubitIdx);

                if (removeOperation) {
                    layer.removeQuantumOperation(operation);
                }
            }
        }

        // Remove all layers that no longer contain any quantum operations.
        layers.removeIf(layer -> layer.getQuantumOperations().isEmpty());
    }

    public void addQuantumOperation(@NonNull QuantumOperation operation, int layerIdx) {
        if (layerIdx < 0 || layerIdx > layers.size()) {
            throw new IllegalArgumentException("Layer index must be between 0 and " + layers.size());
        }

        if (layerIdx == layers.size()) {
            layers.add(new Layer(List.of(operation)));
        } else {
            layers.get(layerIdx).addQuantumOperation(operation);
        }
    }

    public void moveQuantumOperation(@NonNull String operationId,
                                     int layerIdx,
                                     @NonNull List<ElementSelector> targetQubits,
                                     List<ElementSelector> controlQubits) {
        if (layerIdx < 0 || layerIdx > layers.size()) {
            throw new IllegalArgumentException("Layer index must be between 0 and " + layers.size());
        }
        if (targetQubits.isEmpty()) {
            throw new IllegalArgumentException("Must provide at least one qubit to target.");
        }

        for (int idx = 0; idx < layers.size(); idx++) {
            for (QuantumOperation operation : layers.get(idx).getQuantumOperations()) {
                if (operation.getId().equals(operationId)) {

                    // Set new target and control qubits.
                    operation.setTargetQubits(targetQubits);
                    operation.setControlQubits(controlQubits);

                    // Move operation to new layer if changed.
                    if (layerIdx != idx) {
                        addQuantumOperation(operation, layerIdx);
                        layers.get(idx).removeQuantumOperation(operation);
                    }
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
                    break;
                }
            }
        }
    }

    private QuantumRegister findQuantumRegisterById(String registerId) {
        for (Register register : registers) {
            if (register.getId().equals(registerId)) {
                Optional<QuantumRegister> quantumRegister = register.asQuantum();
                if (quantumRegister.isEmpty()) {
                    throw new IllegalArgumentException("Register with quantumOperationId %s is not a QuantumRegister.".formatted(registerId));
                }
                return quantumRegister.get();
            }
        }
        throw new NoSuchElementException("Could not find quantum register with quantumOperationId %s".formatted(registerId));
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("QuantumCircuit(quantumOperationId=").append(id).append(")\n");
        registers.forEach(
                reg -> sb.append("  ").append(reg.toString().replace("\n", "\n  ")).append("\n")
        );
        sb.append("\n");
        layers.forEach(
                lay -> sb.append("  ").append(lay.toString().replace("\n", "\n  ")).append("\n")
        );
        return sb.toString().trim();
    }
}
