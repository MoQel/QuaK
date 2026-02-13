package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementSelector;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaMeasurement;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaQuantumOperation;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuantumOperationJpaMapperTest {
    @Spy
    private ElementSelectorJpaMapperImpl elementSelectorJpaMapper;

    @InjectMocks
    private QuantumOperationJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        ElementSelector target = new ElementSelector("reg_id", 0);
        ElementSelector classicBit = new ElementSelector("reg_id", 1);

        ElementaryQuantumGate domainGate =
                new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), List.of(), 0d);
        Measurement domainMeasurement = new Measurement(
                QuantumOperationLibrary.MEASURE, false, List.of(target), List.of(), List.of(classicBit));

        // Act
        JpaQuantumOperation entityGate = mapper.toEntity(domainGate);
        JpaQuantumOperation entityMeasurement = mapper.toEntity(domainMeasurement);

        // Assert
        assertNotNull(entityGate);
        assertInstanceOf(JpaElementaryQuantumGate.class, entityGate);
        JpaElementaryQuantumGate jpaGate = (JpaElementaryQuantumGate) entityGate;
        assertEquals(QuantumOperationLibrary.X, jpaGate.getOperationDefinition());

        assertNotNull(entityMeasurement);
        assertInstanceOf(JpaMeasurement.class, entityMeasurement);
        JpaMeasurement jpaMeasurement = (JpaMeasurement) entityMeasurement;
        assertEquals(QuantumOperationLibrary.MEASURE, jpaMeasurement.getOperationDefinition());
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaElementSelector entityTarget = new JpaElementSelector();
        entityTarget.setRegisterId("reg_id");
        entityTarget.setIndex(0);

        JpaElementSelector entityClassicBit = new JpaElementSelector();
        entityClassicBit.setRegisterId("reg_id");
        entityClassicBit.setIndex(1);

        JpaElementaryQuantumGate entityGate = new JpaElementaryQuantumGate();
        entityGate.setOperationDefinition(QuantumOperationLibrary.X);
        entityGate.setInverseForm(false);
        entityGate.setTargetQubits(List.of(entityTarget));
        entityGate.setRotationAngle(0d);

        JpaMeasurement entityMeasurement = new JpaMeasurement();
        entityMeasurement.setOperationDefinition(QuantumOperationLibrary.MEASURE);
        entityMeasurement.setInverseForm(false);
        entityMeasurement.setTargetQubits(List.of(entityTarget));
        entityMeasurement.setClassicBits(List.of(entityClassicBit));

        // Act
        QuantumOperation domainGate = mapper.toDomain(entityGate);
        QuantumOperation domainMeasurement = mapper.toDomain(entityMeasurement);

        // Assert
        assertNotNull(domainGate);
        assertInstanceOf(ElementaryQuantumGate.class, domainGate);
        ElementaryQuantumGate gate = (ElementaryQuantumGate) domainGate;
        assertEquals(QuantumOperationLibrary.X, gate.getOperationDefinition());

        assertNotNull(domainMeasurement);
        assertInstanceOf(Measurement.class, domainMeasurement);
        Measurement measurement = (Measurement) domainMeasurement;
        assertEquals(QuantumOperationLibrary.MEASURE, measurement.getOperationDefinition());
    }
}
