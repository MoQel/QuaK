package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.ports.in.CircuitServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapperImpl;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.GateDtoMapperImpl;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.QubitDtoMapperImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CircuitRestAdapter.class)
@Import({CircuitDtoMapperImpl.class, QubitDtoMapperImpl.class, GateDtoMapperImpl.class})
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
        given(circuitServicePort.initCircuit()).willReturn(circuit);

        // Act & Assert
        mockMvc.perform(post("/circuit/init")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(circuit.getId()))
                .andExpect(jsonPath("$.qubits").isArray());
    }

    @Test
    void getCircuit_ShouldReturnCircuit() throws Exception {
        // Arrange
        String circuitId = "test-id";
        QuantumCircuit circuit = new QuantumCircuit();
        given(circuitServicePort.getCircuit(circuitId)).willReturn(circuit);

        // Act & Assert
        mockMvc.perform(get("/circuit/{id}", circuitId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void addQubit_ShouldPersistQubitAndLinkToRegister() throws Exception {
        // Arrange
        String circuitId = "test-id";
        QuantumCircuit circuit = new QuantumCircuit();
        circuit.addRegister();
        given(circuitServicePort.addQubit(circuitId)).willReturn(circuit);

        // Act & Assert
        mockMvc.perform(post("/circuit/qubit/add/{id}", circuitId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.qubits").exists())
                .andExpect(jsonPath("$.qubits").isNotEmpty());
    }
}