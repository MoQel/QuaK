package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import static org.assertj.core.api.Assertions.assertThat;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper.*;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.repository.SpringDataJpaCircuitRepository;
import java.util.List;
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
    LayerJpaMapperImpl.class,
    QuantumOperationJpaMapperImpl.class,
    ElementSelectorJpaMapperImpl.class,
})
class CircuitJpaAdapterTest {
    @Autowired
    private CircuitJpaAdapter jpaAdapter;

    @Autowired
    private SpringDataJpaCircuitRepository springRepository;

    public static final int INIT_QUBITS = 4;

    @Test
    void saveAndFindCircuit_ShouldPersistData() {
        // Arrange
        QuantumCircuit domainCircuit = new QuantumCircuit();
        String circuitId = domainCircuit.getId();

        String registerId = domainCircuit.getRegisters().getFirst().getId();
        domainCircuit.addQubit(registerId);

        int qubitIdx = 0;
        ElementSelector target = new ElementSelector(registerId, qubitIdx);
        double rotationAngle = 0d;
        ElementaryQuantumGate operation =
                new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), null, rotationAngle);
        domainCircuit.addQuantumOperation(operation, 0);

        String layerId = domainCircuit.getLayers().getFirst().getId();

        // Act
        jpaAdapter.save(domainCircuit);
        Optional<QuantumCircuit> found = jpaAdapter.findById(circuitId);

        // Assert
        assertThat(found).isPresent();

        QuantumCircuit foundCircuit = found.get();
        assertThat(foundCircuit.getId()).isEqualTo(circuitId);
        assertThat(foundCircuit.getRegisters()).hasSize(1);
        assertThat(foundCircuit.getLayers()).hasSize(1);

        Register foundRegister = foundCircuit.getRegisters().getFirst();
        assertThat(foundRegister.getId()).isEqualTo(registerId);
        assertThat(foundRegister).isInstanceOf(QuantumRegister.class);

        QuantumRegister foundQuantumRegister = (QuantumRegister) foundRegister;
        assertThat(foundQuantumRegister.getNumberOfQubits()).isEqualTo(INIT_QUBITS + 1);

        Layer foundLayer = foundCircuit.getLayers().getFirst();
        assertThat(foundLayer.getId()).isEqualTo(layerId);
        assertThat(foundLayer.getQuantumOperations()).hasSize(1);

        QuantumOperation foundQuantumOperation =
                foundLayer.getQuantumOperations().getFirst();
        assertThat(foundQuantumOperation).isInstanceOf(ElementaryQuantumGate.class);

        ElementaryQuantumGate foundGate = (ElementaryQuantumGate) foundQuantumOperation;
        assertThat(foundGate.getOperationDefinition()).isEqualTo(QuantumOperationLibrary.X);
        assertThat(foundGate.getTargetQubits()).hasSize(1);
        assertThat(foundGate.getTargetQubits().getFirst().getRegisterId()).isEqualTo(registerId);
        assertThat(foundGate.getTargetQubits().getFirst().getIndex()).isEqualTo(qubitIdx);
        assertThat(foundGate.getRotationAngle()).isEqualTo(rotationAngle);

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
