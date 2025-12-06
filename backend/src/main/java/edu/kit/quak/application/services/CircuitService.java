package edu.kit.quak.application.services;

import edu.kit.quak.application.ports.in.CircuitServicePort;
import edu.kit.quak.application.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import org.springframework.stereotype.Service;

@Service
public class CircuitService implements CircuitServicePort {
    private final CircuitRepositoryPort repository;

    public CircuitService(CircuitRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public QuantumCircuit addQubit() {
        // Get QuantumCircuit from repo
        // circuit.addQubit()
        // repository.save(circuit)
        // return circuit
        return null;
    }
}
