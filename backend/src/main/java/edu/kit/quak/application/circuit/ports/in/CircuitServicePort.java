package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import java.util.List;
import java.util.Optional;

public interface CircuitServicePort {
    /**
     * Creates a new circuit for the given project. Called automatically on project
     * creation.
     */
    QuantumCircuit init(String projectId);

    /**
     * Returns the circuit for the given project. Assumes 1:1 for now; will evolve
     * to listByProjectId.
     */
    Optional<QuantumCircuit> getByProjectId(String projectId);

    /** Returns a specific circuit by its unique ID. */
    Optional<QuantumCircuit> getById(String circuitId);

    /**
     * Deletes a specific circuit by its unique ID.
     */
    void delete(String circuitId);

    /**
     * Resets a specific circuit: deletes it and creates a fresh one with the same
     * projectId.
     * Designed around circuitId so it remains correct when multiple circuits per
     * project are supported.
     */
    QuantumCircuit resetCircuit(String circuitId);

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
