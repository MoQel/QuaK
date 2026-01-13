package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.CircuitJpaMapper;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaCircuitRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class CircuitJpaAdapter implements CircuitRepositoryPort {
    private final SpringDataJpaCircuitRepository repository;
    private final CircuitJpaMapper mapper;

    public CircuitJpaAdapter(SpringDataJpaCircuitRepository repository, CircuitJpaMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<QuantumCircuit> findById(String id) {
        Optional<JpaQuantumCircuit> entity = repository.findById(id);
        return entity.map(mapper::toDomain);
    }

    @Override
    public void save(QuantumCircuit domain) {
        JpaQuantumCircuit entity = mapper.toEntity(domain);
        repository.save(entity);
    }

    @Override
    public void delete(String circuitId) {
        repository.deleteById(circuitId);
    }
}
