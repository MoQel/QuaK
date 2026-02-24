package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQubit;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QubitJpaMapperTest {

    @Spy
    private OperationJpaMapperImpl operationJpaMapper;

    @InjectMocks
    private QubitJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        Qubit domain = new Qubit();
        domain.addOperation(domain.getOperations().size(), new ElementaryQuantumGate(ElementaryQuantumGateDefinitionIdentifier.CX));

        // Act
        JpaQubit entity = mapper.toEntity(domain);

        // Assert
        assertNotNull(entity);
        assertEquals(1, entity.getOperations().size());
        assertEquals(entity, entity.getOperations().getFirst().getQubit()); // AfterMapping
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaQubit entity = new JpaQubit();
        JpaElementaryQuantumGate gate = new JpaElementaryQuantumGate();
        gate.setDefinitionId(ElementaryQuantumGateDefinitionIdentifier.CX);
        entity.setOperations(List.of(gate));

        // Act
        Qubit domain = mapper.toDomain(entity);

        // Assert
        assertNotNull(domain);
        assertEquals(1, domain.getOperations().size());
    }
}
