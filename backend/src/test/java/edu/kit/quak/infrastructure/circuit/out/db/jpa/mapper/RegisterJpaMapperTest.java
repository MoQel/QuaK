package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaClassicRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RegisterJpaMapperTest {
    @InjectMocks
    private RegisterJpaMapperImpl mapper;

    @Test
    void domainToEntity() {
        // Arrange
        QuantumRegister domainQuantumReg = new QuantumRegister("quantum", 1);
        ClassicRegister domainClassicReg = new ClassicRegister("classic", 1);

        // Act
        JpaRegister entityQuantumReg = mapper.toEntity(domainQuantumReg);
        JpaRegister entityClassicReg = mapper.toEntity(domainClassicReg);

        // Assert
        assertNotNull(entityQuantumReg);
        assertEquals("quantum", entityQuantumReg.getName());
        assertInstanceOf(JpaQuantumRegister.class, entityQuantumReg);
        JpaQuantumRegister jpaQuantumReg = (JpaQuantumRegister) entityQuantumReg;
        assertEquals(1, jpaQuantumReg.getNumberOfQubits());

        assertNotNull(entityClassicReg);
        assertEquals("classic", entityClassicReg.getName());
        assertInstanceOf(JpaClassicRegister.class, entityClassicReg);
        JpaClassicRegister jpaClassicReg = (JpaClassicRegister) entityClassicReg;
        assertEquals(1, jpaClassicReg.getNumberOfBits());
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaQuantumRegister entityQuantumReg = new JpaQuantumRegister();
        entityQuantumReg.setName("quantum");
        entityQuantumReg.setNumberOfQubits(1);

        JpaClassicRegister entityClassicReg = new JpaClassicRegister();
        entityClassicReg.setName("classic");
        entityClassicReg.setNumberOfBits(1);

        // Act
        Register domainQuantumReg = mapper.toDomain(entityQuantumReg);
        Register domainClassicReg = mapper.toDomain(entityClassicReg);

        // Assert
        assertNotNull(domainQuantumReg);
        assertEquals("quantum", domainQuantumReg.getName());
        assertInstanceOf(QuantumRegister.class, domainQuantumReg);
        QuantumRegister quantumReg = (QuantumRegister) domainQuantumReg;
        assertEquals(1, quantumReg.getNumberOfQubits());

        assertNotNull(domainClassicReg);
        assertEquals("classic", domainClassicReg.getName());
        assertInstanceOf(ClassicRegister.class, domainClassicReg);
        ClassicRegister classicReg = (ClassicRegister) domainClassicReg;
        assertEquals(1, classicReg.getNumberOfBits());
    }
}
