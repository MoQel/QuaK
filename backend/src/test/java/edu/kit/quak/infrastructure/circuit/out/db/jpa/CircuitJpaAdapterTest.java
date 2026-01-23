package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import static org.assertj.core.api.Assertions.assertThat;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.CircuitJpaMapperImpl;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.OperationJpaMapperImpl;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.QubitJpaMapperImpl;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.RegisterJpaMapperImpl;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaCircuitRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import({
    CircuitJpaAdapter.class,
    CircuitJpaMapperImpl.class,
    RegisterJpaMapperImpl.class,
    QubitJpaMapperImpl.class,
    OperationJpaMapperImpl.class
})
class CircuitJpaAdapterTest {
    @Autowired private CircuitJpaAdapter jpaAdapter;

    @Autowired private SpringDataJpaCircuitRepository springRepository;

    @Test
    void saveAndFindCircuit_ShouldPersistData() {
        // Arrange
        QuantumCircuit domainCircuit = new QuantumCircuit();
        String circuitId = domainCircuit.getId();
        QuantumRegister register = domainCircuit.addQuantumRegister();
        String registerId = register.getId();
        Qubit qubit = register.addQubit();
        String qubitId = qubit.getId();

        // Act
        jpaAdapter.save(domainCircuit);
        Optional<QuantumCircuit> found = jpaAdapter.findById(circuitId);

        // Assert
        assertThat(found).isPresent();

        QuantumCircuit foundCircuit = found.get();
        assertThat(foundCircuit.getId()).isEqualTo(circuitId);
        assertThat(foundCircuit.getRegisters()).hasSize(1);

        Register foundRegister = foundCircuit.getRegisters().getFirst();
        assertThat(foundRegister.getId()).isEqualTo(registerId);
        assertThat(foundRegister).isInstanceOf(QuantumRegister.class);

        QuantumRegister foundQuantumRegister = (QuantumRegister) foundRegister;
        assertThat(foundQuantumRegister.getQubits()).hasSize(1);

        Qubit foundQubit = foundQuantumRegister.getQubits().getFirst();
        assertThat(foundQubit.getId()).isEqualTo(qubitId);

        assertThat(springRepository.findById(circuitId)).isPresent();
    }

    @Test
    void findCircuitById_ShouldReturnEmpty_WhenNotFound() {
        // Act
        Optional<QuantumCircuit> found = jpaAdapter.findById("non-existent");

        // Assert
        assertThat(found).isEmpty();
    }
}
