package edu.kit.quak.application.circuit.ports.in;

import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.core.user.model.User;
import java.util.List;

public interface CircuitServicePort {
    /** Returns a specific circuit by its unique ID. */
    QuantumCircuit getById(String circuitId);

    /**
     * Returns the circuit linked to the given file, creating a fresh one if none
     * exists yet. Access is verified via the file's project.
     */
    QuantumCircuit getOrCreateByFileId(String fileId, User user);

    /**
     * Replaces the registers, layers and repetition frames of an existing circuit with the given
     * content. Identity (circuitId, projectId, fileId) is preserved.
     */
    QuantumCircuit replaceContent(String circuitId, List<Register> registers, List<Layer> layers, List<LoopBlock> loopBlocks, User user);

    /**
     * Deletes a specific circuit by its unique ID.
     */
    void delete(String circuitId, User user);

    /**
     * Resets a specific circuit: deletes it and creates a fresh one with the same
     * projectId and fileId.
     */
    QuantumCircuit resetCircuit(String circuitId, User user);

    QuantumCircuit addQubit(String circuitId, String registerId, User user);

    QuantumCircuit removeQubit(String circuitId, String registerId, int qubitIdx, User user);

    QuantumCircuit addQuantumOperation(String circuitId, QuantumOperation operation, int layerIdx, User user);

    QuantumCircuit moveQuantumOperation(
        String circuitId,
        String operationId,
        int layerIdx,
        List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits,
        User user
    );

    QuantumCircuit removeQuantumOperation(String circuitId, String operationId, User user);

    /**
     * Deletes the circuit linked to the given file. Internal cleanup hook for
     * file deletion; access must be verified by the caller.
     */
    void deleteByFileId(String fileId);

    /**
     * Deletes all circuits belonging to a project's files.
     * Internal cleanup hook for project deletion; access must be verified by the
     * caller.
     */
    void deleteAllByProjectId(String projectId);
}
