package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.CircuitJpaMapper;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaCircuitRepository;
import java.util.Optional;
import org.springframework.stereotype.Repository;

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
    public QuantumCircuit save(QuantumCircuit domain) {
        String circuitId = domain.getId();
        JpaQuantumCircuit entity = mapper.toEntity(domain);
        repository.save(entity);
        return findById(circuitId).orElse(null);
    }

    @Override
    public void delete(String circuitId) {
        repository.deleteById(circuitId);
    }
}
