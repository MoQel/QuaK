package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQubit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class RegisterJpaMapperTest {

    private RegisterJpaMapper mapper;

    @BeforeEach
    void setup() {
        mapper = Mappers.getMapper(RegisterJpaMapper.class);
    }

    @Test
    void domainToEntity() {
        // Arrange
        QuantumRegister domain = new QuantumRegister("name");
        domain.addQubit();

        // Act
        JpaQuantumRegister entity = mapper.toEntity(domain);

        // Assert
        assertEquals("name", entity.getName());

        assertNotNull(entity.getQubits());
        assertEquals(1, entity.getQubits().size());
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaQubit jpaQubit = new JpaQubit();
        jpaQubit.setId("id");

        JpaQuantumRegister entity = new JpaQuantumRegister();
        entity.setName("name");
        entity.setQubits(List.of(jpaQubit));

        // Act
        QuantumRegister domain = mapper.toDomain(entity);

        // Assert
        assertEquals("name", domain.getName());

        assertNotNull(domain.getQubits());
        assertEquals(1, domain.getQubits().size());
    }
}