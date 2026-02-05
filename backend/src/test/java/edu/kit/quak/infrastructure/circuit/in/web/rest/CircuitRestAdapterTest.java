package edu.kit.quak.infrastructure.circuit.in.web.rest;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapperImpl;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.GateDtoMapperImpl;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.QubitDtoMapperImpl;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.RegisterDtoMapperImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CircuitRestAdapter.class)
@Import({CircuitDtoMapperImpl.class, RegisterDtoMapperImpl.class, QubitDtoMapperImpl.class, GateDtoMapperImpl.class})
@WithMockUser(username = "tester", roles = "USER")
class CircuitRestAdapterTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CircuitServicePort circuitServicePort;

    @Test
    void initCircuit_ShouldReturnCreated() throws Exception {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        given(circuitServicePort.init()).willReturn(circuit);

        // Act & Assert
        mockMvc.perform(post("/api/circuit").with(csrf()).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(circuit.getId()))
                .andExpect(jsonPath("$.registers").exists())
                .andExpect(jsonPath("$.registers").isArray())
                .andExpect(jsonPath("$.registers").isEmpty());
    }

    @Test
    void getCircuit_ShouldReturnCircuit() throws Exception {
        // Arrange
        String circuitId = "test-id";
        QuantumCircuit circuit = new QuantumCircuit();
        given(circuitServicePort.get(circuitId)).willReturn(circuit);

        // Act & Assert
        mockMvc.perform(get("/api/circuit/{circuitId}", circuitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void addQubit_ShouldReturnCreated() throws Exception {
        // Arrange
        String circuitId = "test-id";
        QuantumCircuit circuit = new QuantumCircuit();
        QuantumRegister register = circuit.addQuantumRegister();
        register.addQubit();
        given(circuitServicePort.addQubit(circuitId)).willReturn(circuit);

        // Act & Assert
        mockMvc.perform(post("/api/circuit/{circuitId}/qubit", circuitId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registers").exists())
                .andExpect(jsonPath("$.registers").isArray())
                .andExpect(jsonPath("$.registers[0].name").exists())
                .andExpect(jsonPath("$.registers[0].name").value("q0"))
                .andExpect(jsonPath("$.registers[0].qubits").exists())
                .andExpect(jsonPath("$.registers[0].qubits").isArray())
                .andExpect(jsonPath("$.registers[0].qubits[0].gates").isArray());
    }

    @Test
    void deleteQubit_ShouldReturnUpdatedCircuit() throws Exception {
        // Arrange
        String circuitId = "circuit-123";
        String qubitId = "qubit-456";
        QuantumCircuit updatedCircuit = new QuantumCircuit();
        given(circuitServicePort.deleteQubit(circuitId, qubitId)).willReturn(updatedCircuit);

        // Act & Assert
        mockMvc.perform(delete("/api/circuit/{circuitId}/qubit/{qubitId}", circuitId, qubitId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedCircuit.getId()));
    }

    @Test
    void addGate_ShouldReturnCreated() throws Exception {
        // Arrange
        String circuitId = "test-id";
        QuantumCircuit circuit = new QuantumCircuit();
        QuantumRegister register = circuit.addQuantumRegister();
        Qubit qubit = register.addQubit();
        qubit.addOperation(
                qubit.getOperations().size(), new ElementaryQuantumGate(ElementaryQuantumGateDefinitionIdentifier.CX));
        given(circuitServicePort.addGate(circuitId, ElementaryQuantumGateDefinitionIdentifier.CX, 0, 0))
                .willReturn(circuit);
        String payload = """
                {
                    "definitionId": "cx",
                    "toQubitIdx": 0,
                    "toPositionIdx": 0
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/circuit/{circuitId}/gate", circuitId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registers").exists())
                .andExpect(jsonPath("$.registers").isArray())
                .andExpect(jsonPath("$.registers[0].qubits").isArray())
                .andExpect(jsonPath("$.registers[0].qubits").exists())
                .andExpect(jsonPath("$.registers[0].qubits").isArray())
                .andExpect(jsonPath("$.registers[0].qubits[0].gates").isArray())
                .andExpect(jsonPath("$.registers[0].qubits[0].gates[0]").exists())
                .andExpect(jsonPath("$.registers[0].qubits[0].gates[0].definitionId")
                        .value("CX"));
    }
}
