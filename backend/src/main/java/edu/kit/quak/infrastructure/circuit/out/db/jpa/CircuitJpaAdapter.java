package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.CircuitJpaMapper;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaCircuitRepository;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaQuantumOperationRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class CircuitJpaAdapter implements CircuitRepositoryPort {

    private final SpringDataJpaCircuitRepository repository;
    private final SpringDataJpaQuantumOperationRepository operationRepository;
    private final CircuitJpaMapper mapper;

    public CircuitJpaAdapter(
        SpringDataJpaCircuitRepository repository,
        SpringDataJpaQuantumOperationRepository operationRepository,
        CircuitJpaMapper mapper
    ) {
        this.repository = repository;
        this.operationRepository = operationRepository;
        this.mapper = mapper;
    }

    @Override
    public List<String> findExistingOperationIds(Collection<String> operationIds) {
        if (operationIds.isEmpty()) {
            return List.of();
        }
        return operationRepository.findExistingIds(operationIds);
    }

    @Override
    public Optional<QuantumCircuit> findById(String id) {
        Optional<JpaQuantumCircuit> entity = repository.findById(id);
        return entity.map(mapper::toDomain);
    }

    @Override
    public Optional<QuantumCircuit> findByFileId(String fileId) {
        Optional<JpaQuantumCircuit> entity = repository.findByFileId(fileId);
        return entity.map(mapper::toDomain);
    }

    @Override
    public QuantumCircuit save(QuantumCircuit domain) {
        String circuitId = domain.getId();
        JpaQuantumCircuit entity = mapper.toEntity(domain);
        repository.saveAndFlush(entity);
        return findById(circuitId).orElse(null);
    }

    @Override
    public void delete(String circuitId) {
        repository.deleteById(circuitId);
    }

    @Override
    public void deleteByFileId(String fileId) {
        repository.deleteByFileId(fileId);
    }

    @Override
    public void deleteAllByProjectId(String projectId) {
        repository.deleteAllByProjectId(projectId);
    }
}
