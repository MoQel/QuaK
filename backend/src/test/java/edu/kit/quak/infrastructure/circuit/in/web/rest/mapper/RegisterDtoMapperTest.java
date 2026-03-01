package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.ClassicRegisterResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QuantumRegisterResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.RegisterResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RegisterDtoMapperTest {

    @InjectMocks
    private RegisterDtoMapperImpl mapper;

    @Test
    void toResponse() {
        // Arrange
        String name = "name";
        QuantumRegister quantumRegister = new QuantumRegister(name, 2);
        ClassicRegister classicRegister = new ClassicRegister(name, 2);

        // Act
        RegisterResponse quantumRegisterResponse = mapper.toResponse(quantumRegister);
        RegisterResponse classicRegisterResponse = mapper.toResponse(classicRegister);

        // Assert
        assertNotNull(quantumRegisterResponse);
        assertEquals(quantumRegister.getId(), quantumRegisterResponse.getId());
        assertEquals(name, quantumRegisterResponse.getName());
        assertInstanceOf(QuantumRegisterResponse.class, quantumRegisterResponse);
        assertEquals(2, ((QuantumRegisterResponse) quantumRegisterResponse).getNumberOfQubits());

        assertNotNull(classicRegisterResponse);
        assertEquals(classicRegister.getId(), classicRegisterResponse.getId());
        assertEquals(name, classicRegisterResponse.getName());
        assertInstanceOf(ClassicRegisterResponse.class, classicRegisterResponse);
        assertEquals(2, ((ClassicRegisterResponse) classicRegisterResponse).getNumberOfBits());
    }
}
