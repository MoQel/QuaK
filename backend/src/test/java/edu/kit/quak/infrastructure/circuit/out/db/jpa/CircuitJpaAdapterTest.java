package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.CircuitJpaMapperImpl;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.OperationJpaMapperImpl;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.RegisterJpaMapperImpl;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaCircuitRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import({CircuitJpaAdapter.class, CircuitJpaMapperImpl.class, OperationJpaMapperImpl.class, RegisterJpaMapperImpl.class})
class CircuitJpaAdapterTest {

    @Autowired
    private CircuitJpaAdapter jpaAdapter;

    @Autowired
    private SpringDataJpaCircuitRepository springRepository;

    @Test
    void saveAndFindCircuit_ShouldPersistData() {
        // Arrange
        QuantumCircuit domainCircuit = new QuantumCircuit();
        String id = domainCircuit.getId();

        // Act
        jpaAdapter.save(domainCircuit);
        Optional<QuantumCircuit> found = jpaAdapter.findCircuitById(id);

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(id);
        assertThat(springRepository.findById(id)).isPresent();
    }

    @Test
    void findCircuitById_ShouldReturnEmpty_WhenNotFound() {
        // Act
        Optional<QuantumCircuit> found = jpaAdapter.findCircuitById("non-existent");

        // Assert
        assertThat(found).isEmpty();
    }
}