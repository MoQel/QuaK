package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import java.util.List;

public interface CircuitServicePort {
    QuantumCircuit init();

    QuantumCircuit get(String circuitId);

    void delete(String circuitId);

    QuantumCircuit addQubit(String circuitId, String registerId);

    QuantumCircuit removeQubit(String circuitId, String registerId, int qubitIdx);

    QuantumCircuit addQuantumOperation(String circuitId, QuantumOperation operation, int layerIdx);

    QuantumCircuit moveQuantumOperation(
            String circuitId,
            String operationId,
            int layerIdx,
            List<ElementSelector> targetQubits,
            List<ElementSelector> controlQubits);

    QuantumCircuit removeQuantumOperation(String circuitId, String operationId);
}
