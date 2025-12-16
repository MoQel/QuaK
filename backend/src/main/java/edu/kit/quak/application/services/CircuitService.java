package edu.kit.quak.application.services;

import edu.kit.quak.application.ports.in.CircuitServicePort;
import edu.kit.quak.application.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CircuitService implements CircuitServicePort {
    private final CircuitRepositoryPort repository;

    public CircuitService(CircuitRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public QuantumCircuit initCircuit() {
        QuantumCircuit circuit = new QuantumCircuit();
        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit getCircuit(String id) {
        return repository.findCircuitById(id).orElseThrow(EntityNotFoundException::new);
    }

    @Override
    public QuantumCircuit addQubit(String id) {
        QuantumCircuit circuit = getCircuit(id);
        circuit.addRegister();
        repository.save(circuit);
        return circuit;
    }
}
