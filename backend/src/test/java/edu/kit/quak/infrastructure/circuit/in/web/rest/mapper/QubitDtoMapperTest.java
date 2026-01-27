package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QubitResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QubitDtoMapperTest {
    @Spy
    private GateDtoMapperImpl gateDtoMapper;

    @InjectMocks
    private QubitDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        Qubit qubit = new Qubit();
        qubit.addOperation(
                qubit.getOperations().size(), new ElementaryQuantumGate(ElementaryQuantumGateDefinitionIdentifier.H));

        // Act
        QubitResponse response = mapper.toResponse(qubit);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.gates().size());
        assertEquals(
                ElementaryQuantumGateDefinitionIdentifier.H,
                response.gates().getFirst().definitionId());
    }
}
