package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import java.util.List;
import java.util.Optional;

public interface CircuitServicePort {
    QuantumCircuit init(String projectId);

    Optional<QuantumCircuit> getByProjectId(String projectId);

    void deleteByProjectId(String projectId);

    QuantumCircuit resetByProjectId(String projectId);

    QuantumCircuit addQubit(String projectId, String registerId);

    QuantumCircuit removeQubit(String projectId, String registerId, int qubitIdx);

    QuantumCircuit addQuantumOperation(String projectId, QuantumOperation operation, int layerIdx);

    QuantumCircuit moveQuantumOperation(
        String projectId,
        String operationId,
        int layerIdx,
        List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits
    );

    QuantumCircuit removeQuantumOperation(String projectId, String operationId);
}
