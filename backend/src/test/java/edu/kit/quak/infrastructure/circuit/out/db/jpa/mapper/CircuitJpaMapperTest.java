package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CircuitJpaMapperTest {
    @Spy private RegisterJpaMapperImpl registerJpaMapper;

    @InjectMocks private CircuitJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        QuantumCircuit domain = new QuantumCircuit();
        domain.addQuantumRegister();
        domain.addQuantumRegister();

        // Act
        JpaQuantumCircuit entity = mapper.toEntity(domain);

        // Assert
        assertNotNull(entity);
        assertEquals(2, entity.getRegisters().size());
        for (int idx = 0; idx < entity.getRegisters().size(); idx++) {
            assertEquals(String.format("q%d", idx), entity.getRegisters().get(idx).getName());
            assertEquals(entity, entity.getRegisters().get(idx).getCircuit()); // AfterMapping
        }
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaQuantumRegister jpaRegister1 = new JpaQuantumRegister();
        jpaRegister1.setName("q0");
        JpaQuantumRegister jpaRegister2 = new JpaQuantumRegister();
        jpaRegister2.setName("q1");
        List<JpaRegister> jpaRegisters = List.of(jpaRegister1, jpaRegister2);

        JpaQuantumCircuit entity = new JpaQuantumCircuit();
        entity.setRegisters(jpaRegisters);

        // Act
        QuantumCircuit domain = mapper.toDomain(entity);

        // Assert
        assertNotNull(domain);
        assertEquals(2, domain.getRegisters().size());
        for (int idx = 0; idx < domain.getRegisters().size(); idx++) {
            assertEquals(String.format("q%d", idx), domain.getRegisters().get(idx).getName());
        }
    }
}
