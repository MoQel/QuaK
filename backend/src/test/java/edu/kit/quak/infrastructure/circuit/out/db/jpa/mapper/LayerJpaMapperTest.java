package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.spy;

import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementSelector;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementaryQuantumGate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class LayerJpaMapperTest {

    private LayerJpaMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = Mappers.getMapper(LayerJpaMapper.class);
        QuantumOperationJpaMapper quantumOperationJpaMapper = spy(Mappers.getMapper(QuantumOperationJpaMapper.class));
        ElementSelectorJpaMapper elementSelectorJpaMapper = spy(Mappers.getMapper(ElementSelectorJpaMapper.class));
        ReflectionTestUtils.setField(quantumOperationJpaMapper, "elementSelectorJpaMapper", elementSelectorJpaMapper);
        ReflectionTestUtils.setField(mapper, "quantumOperationJpaMapper", quantumOperationJpaMapper);
    }

    @Test
    void domainToEntity() {
        // Arrange
        ElementSelector target = new ElementSelector("reg_id", 0);
        ElementaryQuantumGate operation = new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), null, 0d);
        Layer layer = new Layer(List.of(operation));

        // Act
        JpaLayer entity = mapper.toEntity(layer);

        // Assert
        assertNotNull(entity);
        assertEquals(1, entity.getQuantumOperations().size());
        assertEquals(QuantumOperationLibrary.X, entity.getQuantumOperations().getFirst().getOperationDefinition());
        assertEquals(entity, entity.getQuantumOperations().getFirst().getLayer()); // AfterMapping
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaElementSelector target = new JpaElementSelector();
        target.setRegisterId("reg_id");
        target.setIndex(0);

        JpaElementaryQuantumGate operation = new JpaElementaryQuantumGate();
        operation.setOperationDefinition(QuantumOperationLibrary.X);
        operation.setInverseForm(false);
        operation.setTargetQubits(List.of(target));
        operation.setRotationAngle(0d);

        JpaLayer entity = new JpaLayer();
        entity.setQuantumOperations(List.of(operation));

        // Act
        Layer domain = mapper.toDomain(entity);

        // Assert
        assertNotNull(domain);
        assertEquals(1, domain.getQuantumOperations().size());
        assertEquals(QuantumOperationLibrary.X, domain.getQuantumOperations().getFirst().getOperationDefinition());
    }
}
