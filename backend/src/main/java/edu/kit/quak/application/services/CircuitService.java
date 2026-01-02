package edu.kit.quak.application.services;

import edu.kit.quak.application.ports.in.CircuitServicePort;
import edu.kit.quak.application.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import jakarta.persistence.EntityNotFoundException;
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
        QuantumCircuit circuit = get(circuitId);
        QuantumRegister register = circuit.addQuantumRegister();
        register.addQubit();
        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit deleteQubit(String circuitId, String registerId) {
        QuantumCircuit circuit = get(circuitId);
        circuit.deleteQuantumRegister(registerId);
        repository.save(circuit);
        return circuit;
    }
}
