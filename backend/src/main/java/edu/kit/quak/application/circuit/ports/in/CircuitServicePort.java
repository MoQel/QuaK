package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import java.util.List;
import java.util.Optional;

public interface CircuitServicePort {
    QuantumCircuit init(String projectId);

    Optional<QuantumCircuit> getByProjectId(String projectId);

    void delete(String circuitId);

    QuantumCircuit addQubit(String circuitId, String registerId);

    QuantumCircuit removeQubit(String circuitId, String registerId, int qubitIdx);

    QuantumCircuit addQuantumOperation(String circuitId, QuantumOperation operation, int layerIdx);

    QuantumCircuit moveQuantumOperation(
        String circuitId,
        String operationId,
        int layerIdx,
        List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits
    );

    QuantumCircuit removeQuantumOperation(String circuitId, String operationId);
}
