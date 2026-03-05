package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;

@Service
public class CircuitService implements CircuitServicePort {

    private final CircuitRepositoryPort repository;

    public CircuitService(CircuitRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public QuantumCircuit init(String projectId) {
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        repository.save(circuit);
        return circuit;
    }

    @Override
    public Optional<QuantumCircuit> getByProjectId(String projectId) {
        return repository.findByProjectId(projectId);
    }

    @Override
    public void deleteByProjectId(String projectId) {
        QuantumCircuit circuit = getByProjectId(projectId).orElseThrow(() ->
            new EntityNotFoundException("Circuit not found for project: " + projectId)
        );
        repository.delete(circuit.getId());
    }

    @Override
    public QuantumCircuit resetByProjectId(String projectId) {
        getByProjectId(projectId).ifPresent(circuit -> repository.delete(circuit.getId()));
        return init(projectId);
    }

    @Override
    public QuantumCircuit addQubit(String projectId, String registerId) {
        return updateCircuit(projectId, circuit -> circuit.addQubit(registerId));
    }

    @Override
    public QuantumCircuit removeQubit(String projectId, String registerId, int qubitIdx) {
        return updateCircuit(projectId, circuit -> circuit.removeQubit(registerId, qubitIdx));
    }

    @Override
    public QuantumCircuit addQuantumOperation(String projectId, QuantumOperation operation, int layerIdx) {
        return updateCircuit(projectId, circuit -> circuit.addQuantumOperation(operation, layerIdx));
    }

    @Override
    public QuantumCircuit moveQuantumOperation(
        String projectId,
        String operationId,
        int layerIdx,
        List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits
    ) {
        return updateCircuit(projectId, circuit -> circuit.moveQuantumOperation(operationId, layerIdx, targetQubits, controlQubits));
    }

    @Override
    public QuantumCircuit removeQuantumOperation(String projectId, String operationId) {
        return updateCircuit(projectId, circuit -> circuit.removeQuantumOperation(operationId));
    }

    private QuantumCircuit updateCircuit(String projectId, Consumer<QuantumCircuit> action) {
        QuantumCircuit circuit = getByProjectId(projectId).orElseThrow(() ->
            new EntityNotFoundException("Circuit not found for project: " + projectId)
        );

        action.accept(circuit);

        return repository.save(circuit);
    }
}
