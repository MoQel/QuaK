package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQubit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RegisterJpaMapperTest {

    @Spy
    private OperationJpaMapperImpl operationJpaMapper;

    @InjectMocks
    private RegisterJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        QuantumRegister domain = new QuantumRegister("name");
        domain.addQubit();

        ElementaryQuantumGate gate = new ElementaryQuantumGate(ElementaryQuantumGateType.CNOT);
        domain.getQubits().getFirst().addOperation(gate);

        // Act
        JpaQuantumRegister entity = (JpaQuantumRegister) mapper.toEntity(domain);

        // Assert
        assertNotNull(entity);
        assertEquals("name", entity.getName());
        assertNotNull(entity.getQubits());
        assertEquals(1, entity.getQubits().size());
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaElementaryQuantumGate jpaGate = new JpaElementaryQuantumGate();
        jpaGate.setType(ElementaryQuantumGateType.CNOT);

        JpaQubit jpaQubit = new JpaQubit();
        jpaQubit.setOperations(List.of(jpaGate));

        JpaQuantumRegister entity = new JpaQuantumRegister();
        entity.setName("name");
        entity.setQubits(List.of(jpaQubit));

        // Act
        QuantumRegister domain = (QuantumRegister) mapper.toDomain(entity);

        // Assert
        assertNotNull(domain);
        assertEquals("name", domain.getName());
        assertNotNull(domain.getQubits());
        assertEquals(1, domain.getQubits().size());
    }
}