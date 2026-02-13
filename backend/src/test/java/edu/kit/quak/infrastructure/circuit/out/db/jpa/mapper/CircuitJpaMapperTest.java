package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CircuitJpaMapperTest {
    @Spy
    private RegisterJpaMapperImpl registerJpaMapper;

    @Spy
    private LayerJpaMapperImpl layerJpaMapper;

    @InjectMocks
    private CircuitJpaMapperImpl mapper;

    public static final int INIT_QUBITS = 4;

    @Test
    void domainToEntity() {
        // Arrange
        QuantumCircuit domain = new QuantumCircuit();

        // Act
        JpaQuantumCircuit entity = mapper.toEntity(domain);

        // Assert
        assertNotNull(entity);
        assertEquals(1, entity.getRegisters().size());
        assertEquals("q", entity.getRegisters().getFirst().getName());
        assertInstanceOf(JpaQuantumRegister.class, entity.getRegisters().getFirst());
        assertEquals(INIT_QUBITS, ((JpaQuantumRegister) entity.getRegisters().getFirst()).getNumberOfQubits());
        assertEquals(entity, entity.getRegisters().getFirst().getCircuit()); // AfterMapping

        assertEquals(0, entity.getLayers().size());
    }

    @Test
    void entityToDomain() {
        // Arrange
        JpaQuantumRegister jpaRegister = new JpaQuantumRegister();
        jpaRegister.setName("q");
        jpaRegister.setNumberOfQubits(1);
        JpaLayer jpaLayer = new JpaLayer();

        JpaQuantumCircuit entity = new JpaQuantumCircuit();
        entity.setRegisters(List.of(jpaRegister));
        entity.setLayers(List.of(jpaLayer));

        // Act
        QuantumCircuit domain = mapper.toDomain(entity);

        // Assert
        assertNotNull(domain);
        assertEquals(1, domain.getRegisters().size());
        assertEquals("q", domain.getRegisters().getFirst().getName());
        assertInstanceOf(QuantumRegister.class, domain.getRegisters().getFirst());
        assertEquals(1, ((QuantumRegister) domain.getRegisters().getFirst()).getNumberOfQubits());
        assertEquals(1, domain.getLayers().size());
        assertEquals(0, domain.getLayers().getFirst().getQuantumOperations().size());
    }
}
