package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import jakarta.persistence.EntityNotFoundException;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;

@Service
public class CircuitService implements CircuitServicePort {

    private final CircuitRepositoryPort repository;

    public CircuitService(CircuitRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public QuantumCircuit init() {
        QuantumCircuit circuit = new QuantumCircuit();
        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit get(String circuitId) {
        return repository.findById(circuitId).orElseThrow(EntityNotFoundException::new);
    }

    @Override
    public void delete(String circuitId) {
        repository.delete(circuitId);
    }

    @Override
    public QuantumCircuit addQubit(String circuitId) {
        return updateCircuit(circuitId, QuantumCircuit::addQubit);
    }

    @Override
    public QuantumCircuit changeQubitName(String circuitId, String qubitId, String name) {
        return updateCircuit(circuitId, circuit -> circuit.changeQubitName(qubitId, name));
    }

    @Override
    public QuantumCircuit deleteQubit(String circuitId, String qubitId) {
        return updateCircuit(circuitId, circuit -> circuit.deleteQuantumRegister(qubitId));
    }

    @Override
    public QuantumCircuit addGate(String circuitId, ElementaryQuantumGateDefinitionIdentifier definitionId, int qubitIdx, int positionIdx) {
        return updateCircuit(circuitId, circuit -> circuit.addElementaryQuantumGate(definitionId, qubitIdx, positionIdx));
    }

    @Override
    public QuantumCircuit moveGate(String circuitId, String gateId, int targetQubitIdx, int positionIdx) {
        return updateCircuit(circuitId, circuit -> circuit.moveQuantumOperation(gateId, targetQubitIdx, positionIdx));
    }

    @Override
    public QuantumCircuit deleteGate(String circuitId, String gateId) {
        return updateCircuit(circuitId, circuit -> circuit.deleteQuantumOperation(gateId));
    }

    private QuantumCircuit updateCircuit(String circuitId, Consumer<QuantumCircuit> action) {
        QuantumCircuit circuit = repository
            .findById(circuitId)
            .orElseThrow(() -> new EntityNotFoundException("Circuit not found: " + circuitId));

        action.accept(circuit);

        return repository.save(circuit);
    }
}
