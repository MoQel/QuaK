package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQubit;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RegisterJpaMapperTest {
    @Spy
    private QubitJpaMapperImpl qubitJpaMapper;

    @InjectMocks
    private RegisterJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        QuantumRegister domain = new QuantumRegister("name");
        domain.addQubit();

        // Act
        JpaQuantumRegister entity = (JpaQuantumRegister) mapper.toEntity(domain);

        // Assert
        assertNotNull(entity);
        assertEquals("name", entity.getName());
        assertNotNull(entity.getQubits());
        assertEquals(1, entity.getQubits().size());
        assertEquals(entity, entity.getQubits().getFirst().getRegister()); // AfterMapping
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaQuantumRegister entity = new JpaQuantumRegister();
        entity.setName("name");
        JpaQubit jpaQubit = new JpaQubit();
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
