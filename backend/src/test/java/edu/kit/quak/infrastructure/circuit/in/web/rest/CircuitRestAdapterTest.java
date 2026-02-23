package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CircuitRestAdapter.class)
@Import({
    CircuitDtoMapperImpl.class,
    RegisterDtoMapperImpl.class,
    LayerDtoMapperImpl.class,
    QuantumOperationDtoMapperImpl.class,
    ElementSelectorDtoMapperImpl.class
})
@WithMockUser(username = "tester", roles = "USER")
class CircuitRestAdapterTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CircuitServicePort circuitServicePort;

    public static final int INIT_QUBITS = 4;

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
                .andExpect(jsonPath("$.registers.size()").value(1))
                .andExpect(jsonPath("$.layers").exists())
                .andExpect(jsonPath("$.layers").isArray())
                .andExpect(jsonPath("$.layers.size()").value(0));
    }

    @Test
    void getCircuit_ShouldReturnCircuit() throws Exception {
        // Arrange
        String circuitId = "test-quantumOperationId";
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
        String circuitId = "test-quantumOperationId";
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().getId();
        circuit.addQubit(registerId);
        given(circuitServicePort.addQubit(circuitId, registerId)).willReturn(circuit);

        // Act & Assert
        mockMvc.perform(post("/api/circuit/{circuitId}/register/{registerId}", circuitId, registerId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registers").exists())
                .andExpect(jsonPath("$.registers").isArray())
                .andExpect(jsonPath("$.registers[0].name").exists())
                .andExpect(jsonPath("$.registers[0].name").value("q"))
                .andExpect(jsonPath("$.registers[0].numberOfQubits").exists())
                .andExpect(jsonPath("$.registers[0].numberOfQubits").value(INIT_QUBITS + 1));
    }

    @Test
    void removeQubit_ShouldReturnUpdatedCircuit() throws Exception {
        // Arrange
        String circuitId = "circuit-123";
        String registerId = "register-456";
        QuantumCircuit updatedCircuit = new QuantumCircuit();
        int qubitIdx = 0;
        given(circuitServicePort.removeQubit(circuitId, registerId, qubitIdx)).willReturn(updatedCircuit);

        // Act & Assert
        mockMvc.perform(delete(
                                "/api/circuit/{circuitId}/register/{registerId}/{qubitIdx}",
                                circuitId,
                                registerId,
                                qubitIdx)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(updatedCircuit.getId()));
    }

    @Test
    void addQuantumOperation_ShouldReturnCreated() throws Exception {
        // Arrange
        String circuitId = "test-quantumOperationId";
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().getId();
        circuit.addQubit(registerId);
        ElementSelector target = new ElementSelector(registerId, 0);
        ElementaryQuantumGate operation =
                new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(target), null, 0d);
        int layerIdx = 0;
        circuit.addQuantumOperation(operation, layerIdx);
        given(circuitServicePort.addQuantumOperation(eq(circuitId), any(QuantumOperation.class), eq(layerIdx)))
                .willReturn(circuit);
        String payload = """
                {
                    "quantumOperation": {
                        "type": "ELEMENTARY_QUANTUM_GATE",
                        "identifier": "H",
                        "inverseForm": false,
                        "targetQubits": [{
                            "registerId": "%s",
                            "index": 0
                        }],
                        "controlQubits": null,
                        "rotationAngle": 0.0
                    },
                    "layerIdx": 0
                }
                """.formatted(registerId);

        // Act & Assert
        mockMvc.perform(post("/api/circuit/{circuitId}/operation", circuitId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.layers").exists())
                .andExpect(jsonPath("$.layers").isArray())
                .andExpect(jsonPath("$.layers[0].quantumOperations").exists())
                .andExpect(jsonPath("$.layers[0].quantumOperations").isArray())
                .andExpect(jsonPath("$.layers[0].quantumOperations[0]").exists())
                .andExpect(jsonPath("$.layers[0].quantumOperations[0].id").value(operation.getId()));
    }
}
