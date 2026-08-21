package edu.kit.quak.infrastructure.circuit.out.db.jpa;

import static org.assertj.core.api.Assertions.assertThat;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
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
@Import(
    {
        CircuitJpaAdapter.class,
        CircuitJpaMapperImpl.class,
        RegisterJpaMapperImpl.class,
        LayerJpaMapperImpl.class,
        QuantumOperationJpaMapperImpl.class,
        ElementSelectorJpaMapperImpl.class,
    }
)
class CircuitJpaAdapterTest {

    @Autowired
    private CircuitJpaAdapter jpaAdapter;

    @Autowired
    private SpringDataJpaCircuitRepository springRepository;

    public static final int INIT_QUBITS = 4;

    @Test
    void saveAndFindCircuit_ShouldPersistData() {
        // Arrange
        String projectId = "p-id";
        QuantumCircuit domainCircuit = new QuantumCircuit(projectId, "f-1");
        String circuitId = domainCircuit.getId();

        String registerId = domainCircuit.getRegisters().getFirst().getId();
        domainCircuit.addQubit(registerId);

        int qubitIdx = 0;
        ElementSelector target = new ElementSelector(registerId, qubitIdx);
        double rotationAngle = 0d;
        ElementaryQuantumGate operation = new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), null, rotationAngle);
        domainCircuit.addQuantumOperation(operation, 0);

        String layerId = domainCircuit.getLayers().getFirst().getId();

        // Act
        jpaAdapter.save(domainCircuit);
        Optional<QuantumCircuit> found = jpaAdapter.findById(circuitId);

        // Assert
        assertThat(found).isPresent();

        QuantumCircuit foundCircuit = found.get();
        assertThat(foundCircuit.getId()).isEqualTo(circuitId);
        assertThat(foundCircuit.getProjectId()).isEqualTo(projectId);
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

        QuantumOperation foundQuantumOperation = foundLayer.getQuantumOperations().getFirst();
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

    @Test
    void findCircuitByFileId() {
        // Arrange
        String projectId = "p-id";
        String fileId = "f-id";
        QuantumCircuit domainCircuit = new QuantumCircuit(projectId, fileId);

        // Act
        jpaAdapter.save(domainCircuit);
        Optional<QuantumCircuit> found = jpaAdapter.findByFileId(fileId);
        Optional<QuantumCircuit> notFound = jpaAdapter.findByFileId("unknown");

        // Assert
        assertThat(found).isPresent();
        assertThat(notFound).isNotPresent();
    }

    @Test
    void saveAndFindCircuit_withSubcircuitOperation_ShouldPersistData() {
        // Arrange
        String circuitId = "comp-circuit-id";
        String projectId = "comp-project-id";
        String layerId = "comp-layer-id";
        String registerId = "comp-register-id";
        String definitionCircuitId = "referenced-subcircuit-id";

        ElementSelector target0 = new ElementSelector(registerId, 0);
        ElementSelector target1 = new ElementSelector(registerId, 1);
        ElementSelector control0 = new ElementSelector(registerId, 2);

        SubcircuitOperation compositeOp = new SubcircuitOperation(true, List.of(target0, target1), List.of(control0), definitionCircuitId);
        compositeOp.setId("comp-op-id");

        Layer layer = new Layer(List.of(compositeOp));
        layer.setId(layerId);

        QuantumRegister register = new QuantumRegister("q", 4);
        register.setId(registerId);

        QuantumCircuit domainCircuit = QuantumCircuit.builder()
            .id(circuitId)
            .projectId(projectId)
            .registers(List.of(register))
            .layers(List.of(layer))
            .build();

        // Act
        jpaAdapter.save(domainCircuit);
        Optional<QuantumCircuit> found = jpaAdapter.findById(circuitId);

        // Assert
        assertThat(found).isPresent();
        QuantumCircuit foundCircuit = found.get();
        assertThat(foundCircuit.getId()).isEqualTo(circuitId);
        assertThat(foundCircuit.getLayers()).hasSize(1);

        QuantumOperation foundOp = foundCircuit.getLayers().getFirst().getQuantumOperations().getFirst();
        assertThat(foundOp).isInstanceOf(SubcircuitOperation.class);

        SubcircuitOperation foundComposite = (SubcircuitOperation) foundOp;
        assertThat(foundComposite.getId()).isEqualTo("comp-op-id");
        assertThat(foundComposite.isInverseForm()).isTrue();
        assertThat(foundComposite.getDefinitionCircuitId()).isEqualTo(definitionCircuitId);
        assertThat(foundComposite.getTargetQubits()).hasSize(2);
        assertThat(foundComposite.getTargetQubits().get(0).getIndex()).isEqualTo(0);
        assertThat(foundComposite.getTargetQubits().get(1).getIndex()).isEqualTo(1);
        assertThat(foundComposite.getControlQubits()).hasSize(1);
        assertThat(foundComposite.getControlQubits().getFirst().getIndex()).isEqualTo(2);
    }
}
