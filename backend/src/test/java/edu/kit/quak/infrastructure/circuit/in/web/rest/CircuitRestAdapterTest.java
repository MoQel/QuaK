package edu.kit.quak.infrastructure.circuit.in.web.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.application.circuit.exceptions.CircuitNotFoundException;
import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.*;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SuppressWarnings("null")
@WebMvcTest(CircuitRestAdapter.class)
@Import(
    {
        CircuitDtoMapperImpl.class,
        RegisterDtoMapperImpl.class,
        LayerDtoMapperImpl.class,
        QuantumOperationDtoMapperImpl.class,
        ElementSelectorDtoMapperImpl.class,
    }
)
@WithMockUser(username = "tester", roles = "USER")
class CircuitRestAdapterTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CircuitServicePort circuitServicePort;

    @MockitoBean
    private ProjectServicePort projectService;

    @MockitoBean
    private UserServicePort userService;

    @MockitoBean
    private AuthenticationMapper authMapper;

    public static final int INIT_QUBITS = 4;

    @Test
    void getCircuitByProjectId_ProjectHasCircuit_ShouldReturnCircuit() throws Exception {
        // Arrange
        String projectId = "p-id";
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        given(circuitServicePort.getByProjectId(projectId)).willReturn(circuit);

        // Act & Assert
        mockMvc
            .perform(get("/api/circuit/{projectId}", projectId).with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.projectId").value(projectId));
    }

    @Test
    void getCircuitByProjectId_ProjectHasNoCircuit_ShouldThrow404() throws Exception {
        // Arrange
        String projectId = "unknown";
        given(circuitServicePort.getByProjectId(projectId)).willThrow(CircuitNotFoundException.class);

        // Act & Assert
        mockMvc.perform(get("/api/circuit/{projectId}", projectId).with(csrf())).andExpect(status().is(404));
    }

    @Test
    void addQubit_ShouldReturnCreated() throws Exception {
        // Arrange
        String projectId = "p-id";
        String circuitId = "c-id";
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        circuit.setId(circuitId);
        String registerId = circuit.getRegisters().getFirst().getId();
        circuit.addQubit(registerId);

        given(circuitServicePort.getById(circuitId)).willReturn(circuit);
        given(circuitServicePort.addQubit(circuitId, registerId)).willReturn(circuit);

        // Act & Assert
        mockMvc
            .perform(
                post("/api/circuit/{circuitId}/register/{registerId}", circuitId, registerId)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.registers").exists())
            .andExpect(jsonPath("$.registers").isArray())
            .andExpect(jsonPath("$.registers[0].numberOfQubits").value(INIT_QUBITS + 1));
    }

    @Test
    void removeQubit_ShouldReturnUpdatedCircuit() throws Exception {
        // Arrange
        String projectId = "p-id";
        String circuitId = "c-id";
        String registerId = "register-456";
        int qubitIdx = 0;
        QuantumCircuit updatedCircuit = new QuantumCircuit(projectId);
        updatedCircuit.setId(circuitId);

        given(circuitServicePort.getById(circuitId)).willReturn(updatedCircuit);
        given(circuitServicePort.removeQubit(circuitId, registerId, qubitIdx)).willReturn(updatedCircuit);

        // Act & Assert
        mockMvc
            .perform(
                delete("/api/circuit/{circuitId}/register/{registerId}/{qubitIdx}", circuitId, registerId, qubitIdx)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.projectId").value(projectId));
    }

    @Test
    void resetCircuit_ShouldReturnFreshCircuit() throws Exception {
        // Arrange
        String projectId = "p-id";
        String circuitId = "c-id";
        QuantumCircuit existingCircuit = new QuantumCircuit(projectId);
        existingCircuit.setId(circuitId);
        QuantumCircuit freshCircuit = new QuantumCircuit(projectId);

        given(circuitServicePort.getById(circuitId)).willReturn(existingCircuit);
        given(circuitServicePort.resetCircuit(circuitId)).willReturn(freshCircuit);

        // Act & Assert
        mockMvc
            .perform(delete("/api/circuit/{circuitId}/reset", circuitId).with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.projectId").value(projectId));
    }

    @Test
    void addQuantumOperation_ShouldReturnCreated() throws Exception {
        // Arrange
        String projectId = "p-id";
        String circuitId = "c-id";
        QuantumCircuit circuit = new QuantumCircuit(projectId);
        circuit.setId(circuitId);
        String registerId = circuit.getRegisters().getFirst().getId();
        circuit.addQubit(registerId);
        ElementSelector target = new ElementSelector(registerId, 0);
        ElementaryQuantumGate operation = new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(target), null, 0d);
        int layerIdx = 0;
        circuit.addQuantumOperation(operation, layerIdx);

        given(circuitServicePort.getById(circuitId)).willReturn(circuit);
        given(circuitServicePort.addQuantumOperation(eq(circuitId), any(QuantumOperation.class), eq(layerIdx))).willReturn(circuit);

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
        mockMvc
            .perform(
                post("/api/circuit/{circuitId}/operation", circuitId).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(payload)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.layers").exists())
            .andExpect(jsonPath("$.layers").isArray())
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].id").value(operation.getId()));
    }
}
