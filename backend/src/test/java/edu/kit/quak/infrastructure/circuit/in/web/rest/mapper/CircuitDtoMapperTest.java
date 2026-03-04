package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CircuitDtoMapperTest {

    @Spy
    private RegisterDtoMapperImpl registerDtoMapper;

    @Spy
    private LayerDtoMapperImpl layerDtoMapper;

    @InjectMocks
    private CircuitDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();

        // Act
        CircuitResponse response = mapper.toResponse(circuit);

        // Assert
        assertNotNull(response);
        assertEquals(circuit.getId(), response.id());
        assertEquals(1, response.registers().size());
        assertEquals("q", response.registers().getFirst().getName());
        assertEquals(0, response.layers().size());
    }
}
