package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QubitResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class QubitDtoMapperTest {

    @Spy
    private GateDtoMapperImpl gateDtoMapper;

    @InjectMocks
    private QubitDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        QuantumRegister register = new QuantumRegister("q0");
        register.addQubit();
        register.getQubits().getFirst().addOperation(new ElementaryQuantumGate(ElementaryQuantumGateType.H));

        // Act
        QubitResponse response = mapper.toResponse(register.getQubits().getFirst(),  register.getName());

        // Assert
        assertNotNull(response);
        assertEquals("q0", response.name());
        assertEquals(1, response.gates().size());
        assertEquals(ElementaryQuantumGateType.H.name(), response.gates().getFirst().type());
    }
}
