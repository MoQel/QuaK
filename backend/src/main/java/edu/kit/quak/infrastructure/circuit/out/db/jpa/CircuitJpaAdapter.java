package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import edu.kit.quak.application.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.CircuitJpaMapper;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaCircuitRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class CircuitJpaAdapter implements CircuitRepositoryPort {

    private final SpringDataJpaCircuitRepository jpaCircuitRepository;
    private final CircuitJpaMapper mapper;

    public CircuitJpaAdapter(SpringDataJpaCircuitRepository jpaCircuitRepository, CircuitJpaMapper mapper) {
        this.jpaCircuitRepository = jpaCircuitRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<QuantumCircuit> findCircuitById(String id) {
        Optional<JpaCircuit> jpaCircuit = jpaCircuitRepository.findById(id);
        return jpaCircuit.map(mapper::toDomainEntity);
    }

    @Override
    public QuantumCircuit save(QuantumCircuit circuit) {
        return null;
    }
}
