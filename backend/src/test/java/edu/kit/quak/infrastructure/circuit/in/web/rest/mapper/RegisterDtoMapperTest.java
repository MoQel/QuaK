package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.RegisterResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class RegisterDtoMapperTest {
    @Spy
    private QubitDtoMapperImpl qubitDtoMapper;

    @InjectMocks
    private RegisterDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        String name = "name";
        QuantumRegister register = new QuantumRegister(name);
        register.addQubit();
        register.addQubit();

        // Act
        RegisterResponse response = mapper.toResponse(register);

        // Assert
        assertNotNull(response);
        assertEquals(register.getId(), response.id());
        assertEquals(name, response.name());
        assertEquals(2, response.qubits().size());
    }
}
