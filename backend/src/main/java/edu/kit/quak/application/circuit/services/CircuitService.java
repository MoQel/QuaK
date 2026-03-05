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
    public Optional<QuantumCircuit> getById(String circuitId) {
        return repository.findById(circuitId);
    }

    @Override
    public void deleteByProjectId(String projectId) {
        QuantumCircuit circuit = getByProjectId(projectId).orElseThrow(() ->
            new EntityNotFoundException("Circuit not found for project: " + projectId)
        );
        repository.delete(circuit.getId());
    }

    @Override
    public QuantumCircuit resetByCircuitId(String circuitId) {
        QuantumCircuit existing = repository
            .findById(circuitId)
            .orElseThrow(() -> new EntityNotFoundException("Circuit not found: " + circuitId));
        String projectId = existing.getProjectId();
        repository.delete(circuitId);
        return init(projectId);
    }

    @Override
    public QuantumCircuit addQubit(String circuitId, String registerId) {
        return updateCircuit(circuitId, circuit -> circuit.addQubit(registerId));
    }

    @Override
    public QuantumCircuit removeQubit(String circuitId, String registerId, int qubitIdx) {
        return updateCircuit(circuitId, circuit -> circuit.removeQubit(registerId, qubitIdx));
    }

    @Override
    public QuantumCircuit addQuantumOperation(String circuitId, QuantumOperation operation, int layerIdx) {
        return updateCircuit(circuitId, circuit -> circuit.addQuantumOperation(operation, layerIdx));
    }

    @Override
    public QuantumCircuit moveQuantumOperation(
        String circuitId,
        String operationId,
        int layerIdx,
        List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits
    ) {
        return updateCircuit(circuitId, circuit -> circuit.moveQuantumOperation(operationId, layerIdx, targetQubits, controlQubits));
    }

    @Override
    public QuantumCircuit removeQuantumOperation(String circuitId, String operationId) {
        return updateCircuit(circuitId, circuit -> circuit.removeQuantumOperation(operationId));
    }

    private QuantumCircuit updateCircuit(String circuitId, Consumer<QuantumCircuit> action) {
        QuantumCircuit circuit = repository
            .findById(circuitId)
            .orElseThrow(() -> new EntityNotFoundException("Circuit not found: " + circuitId));

        action.accept(circuit);

        return repository.save(circuit);
    }
}
