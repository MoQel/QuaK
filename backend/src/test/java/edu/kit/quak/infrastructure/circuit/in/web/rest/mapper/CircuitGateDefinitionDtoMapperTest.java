package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.GateResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class CircuitGateDefinitionDtoMapperTest {
    @InjectMocks
    private GateDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        ElementaryQuantumGate gate = new ElementaryQuantumGate(ElementaryQuantumGateDefinitionIdentifier.X);

        // Act
        GateResponse response = mapper.toResponse(gate);

        // Assert
        assertNotNull(response);
        assertEquals(gate.getId(), response.id());
        assertEquals(ElementaryQuantumGateDefinitionIdentifier.X, response.definitionId());
    }
}