package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitGateResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class CircuitGateDtoMapperTest {
    @InjectMocks
    private CircuitGateDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        ElementaryQuantumGate gate = new ElementaryQuantumGate(ElementaryQuantumGateType.X);

        // Act
        CircuitGateResponse response = mapper.toResponse(gate);

        // Assert
        assertNotNull(response);
        assertEquals(gate.getId(), response.id());
        assertEquals(ElementaryQuantumGateType.X, response.type());
    }
}