package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaQuantumOperation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OperationJpaMapperTest {
    @InjectMocks
    private OperationJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        ElementaryQuantumGate domain = new ElementaryQuantumGate(ElementaryQuantumGateDefinitionIdentifier.CX);

        // Act
        JpaQuantumOperation entity = mapper.toEntity(domain);

        // Assert
        assertNotNull(entity);
        assertInstanceOf(JpaElementaryQuantumGate.class, entity);
        JpaElementaryQuantumGate jpaGate = (JpaElementaryQuantumGate) entity;
        assertEquals(ElementaryQuantumGateDefinitionIdentifier.CX, jpaGate.getDefinitionId());
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaElementaryQuantumGate entity = new JpaElementaryQuantumGate();
        entity.setDefinitionId(ElementaryQuantumGateDefinitionIdentifier.H);

        // Act
        QuantumOperation domain = mapper.toDomain(entity);

        // Assert
        assertNotNull(domain);
        assertInstanceOf(ElementaryQuantumGate.class, domain);
        ElementaryQuantumGate gate = (ElementaryQuantumGate) domain;
        assertEquals(ElementaryQuantumGateDefinitionIdentifier.H, gate.getDefinitionId());
    }
}
