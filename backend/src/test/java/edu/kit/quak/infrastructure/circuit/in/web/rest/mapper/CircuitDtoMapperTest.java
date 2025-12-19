package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CircuitDtoMapperTest {

    @Spy
    private GateDtoMapperImpl gateDtoMapper;

    @Spy
    @InjectMocks
    private QubitDtoMapperImpl qubitDtoMapper;

    @InjectMocks
    private CircuitDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        circuit.addRegister();
        circuit.addRegister();

        // Act
        CircuitResponse response = mapper.toResponse(circuit);

        // Assert
        assertNotNull(response);
        assertEquals(circuit.getId(), response.id());
        assertEquals(2, response.qubits().size());
        assertEquals("q0", response.qubits().get(0).name());
        assertEquals("q1", response.qubits().get(1).name());
    }
}
