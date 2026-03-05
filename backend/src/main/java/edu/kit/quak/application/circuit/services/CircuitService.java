package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.exceptions.CircuitNotFoundException;
import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.function.Consumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class CircuitService implements CircuitServicePort {

    private final CircuitRepositoryPort repository;

    public CircuitService(CircuitRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public QuantumCircuit init(String projectId) {
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        log.info("Initialized new quantum circuit. circuitId={}", circuit.getId());
        return repository.save(circuit);
    }

    @Override
    public QuantumCircuit getByProjectId(String projectId) {
        return repository
            .findByProjectId(projectId)
            .orElseThrow(() -> {
                log.warn("Circuit lookup failed for projectId={}", projectId);
                return new CircuitNotFoundException("ID Unknown; projectId: " + projectId);
            });
    }

    @Override
    public QuantumCircuit getById(String circuitId) {
        return repository
            .findById(circuitId)
            .orElseThrow(() -> {
                log.warn("Circuit lookup failed. circuitId={}", circuitId);
                return new CircuitNotFoundException("Circuit not found: " + circuitId);
            });
    }

    @Override
    public void delete(String circuitId) {
        log.info("Deleting circuit. circuitId={}", circuitId);
        repository.delete(circuitId);
    }

    @Override
    public QuantumCircuit resetCircuit(String circuitId) {
        QuantumCircuit existing = repository
            .findById(circuitId)
            .orElseThrow(() -> new EntityNotFoundException("Circuit not found: " + circuitId));
        String projectId = existing.getProjectId();
        repository.delete(circuitId);
        return init(projectId);
    }

    @Override
    public QuantumCircuit addQubit(String circuitId, String registerId) {
        log.info("Adding qubit to register. circuitId={}, registerId={}", circuitId, registerId);
        return updateCircuit(circuitId, circuit -> circuit.addQubit(registerId));
    }

    @Override
    public QuantumCircuit removeQubit(String circuitId, String registerId, int qubitIdx) {
        log.info("Removing qubit from register. circuitId={}, registerId={}, idx={}", circuitId, registerId, qubitIdx);
        return updateCircuit(circuitId, circuit -> circuit.removeQubit(registerId, qubitIdx));
    }

    @Override
    public QuantumCircuit addQuantumOperation(String circuitId, QuantumOperation operation, int layerIdx) {
        log.info("Adding quantum operation to circuit. circuitId={}, layerIdx={}", circuitId, layerIdx);
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
        log.info("Moving quantum operation. circuitId={}, operationId={}", circuitId, operationId);
        return updateCircuit(circuitId, circuit -> circuit.moveQuantumOperation(operationId, layerIdx, targetQubits, controlQubits));
    }

    @Override
    public QuantumCircuit removeQuantumOperation(String circuitId, String operationId) {
        return updateCircuit(circuitId, circuit -> circuit.removeQuantumOperation(operationId));
    }

    private QuantumCircuit updateCircuit(String circuitId, Consumer<QuantumCircuit> action) {
        QuantumCircuit circuit = repository
            .findById(circuitId)
            .orElseThrow(() -> {
                log.warn("Update failed: Circuit not found. circuitId={}", circuitId);
                return new CircuitNotFoundException(circuitId);
            });

        action.accept(circuit);

        return repository.save(circuit);
    }
}
