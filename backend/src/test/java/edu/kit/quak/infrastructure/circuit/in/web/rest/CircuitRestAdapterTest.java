package edu.kit.quak.infrastructure.circuit.in.web.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.circuit.ports.in.SubcircuitNameServicePort;
import edu.kit.quak.application.circuit.ports.out.QasmSource;
import edu.kit.quak.application.circuit.services.ProjectQasmIncludeResolver;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.*;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
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
        QasmService.class,
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
    private SubcircuitNameServicePort subcircuitNameServicePort;

    @MockitoBean
    private ProjectQasmIncludeResolver includeResolver;

    @MockitoBean
    private ProjectServicePort projectService;

    @MockitoBean
    private UserServicePort userService;

    @MockitoBean
    private AuthenticationMapper authMapper;

    public static final int INIT_QUBITS = 4;

    @Test
    void parseQasmCode_ShouldReturnContentWithoutIdentity() throws Exception {
        String qasm = """
            OPENQASM 3.0;
            include "stdgates.inc";
            qubit[2] q;
            h q[0];
            cx q[0], q[1];
            """;

        mockMvc
            .perform(post("/api/circuit/parse").with(csrf()).contentType(MediaType.TEXT_PLAIN).content(qasm))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").doesNotExist())
            .andExpect(jsonPath("$.projectId").doesNotExist())
            .andExpect(jsonPath("$.fileId").doesNotExist())
            .andExpect(jsonPath("$.registers[0].numberOfQubits").value(2))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].identifier").value("H"));
    }

    /**
     * The fileId query parameter is what lets `include` reach the project's other files. This
     * pins the wiring from the parameter through the resolver into the parser.
     */
    @Test
    void parseQasmCode_WithFileId_ShouldResolveIncludes() throws Exception {
        String bell = """
            OPENQASM 3.0;
            gate bell a, b {
                h a;
                cx a, b;
            }
            """;
        given(includeResolver.forUser(any())).willReturn((fromFileId, path) ->
            "bell.qasm".equals(path) ? java.util.Optional.of(new QasmSource("f-bell", "bell.qasm", bell)) : java.util.Optional.empty()
        );

        String main = """
            OPENQASM 3.0;
            include "bell.qasm";
            qubit[2] q;
            bell q[0], q[1];
            """;

        // The included gate arrives as one composite box, carrying its ports and its contents.
        mockMvc
            .perform(post("/api/circuit/parse").param("fileId", "f-main").with(csrf()).contentType(MediaType.TEXT_PLAIN).content(main))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].type").value("COMPOSITE_QUANTUM_GATE"))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].identifier").value("bell"))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].portLabels").value(org.hamcrest.Matchers.contains("a", "b")))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].usedQubitPositions").value(org.hamcrest.Matchers.contains(0, 1)))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].body[0].identifier").value("H"))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].body[1].identifier").value("CX"));
    }

    /**
     * A malformed composite used to die in a Lombok {@code @NonNull} check deep in the model or in
     * Jackson's subtype resolution, and the catch-all handler turned both into a 500 "An unexpected
     * error occurred." — blaming the server for a client mistake and naming nothing actionable.
     * Every shape below has to answer with a self-explaining 4xx instead.
     */
    @ParameterizedTest(name = "{0}")
    @MethodSource("malformedCompositePayloads")
    void putCircuit_MalformedComposite_ShouldNotBeAServerError(String name, String body, int expectedStatus, String expectedText)
        throws Exception {
        mockMvc
            .perform(put("/api/circuit/c1").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().is(expectedStatus))
            .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString(expectedText)));
    }

    private static java.util.stream.Stream<org.junit.jupiter.params.provider.Arguments> malformedCompositePayloads() {
        String registers = "\"registers\":[{\"type\":\"Quantum_Register\",\"id\":\"r1\",\"name\":\"q\",\"numberOfQubits\":2}]";
        String qubits = "\"targetQubits\":[{\"registerId\":\"r1\",\"index\":0},{\"registerId\":\"r1\",\"index\":1}]";
        java.util.function.Function<String, String> circuit = operation ->
            "{" + registers + ",\"layers\":[{\"quantumOperations\":[" + operation + "]}]}";

        return java.util.stream.Stream.of(
            org.junit.jupiter.params.provider.Arguments.of(
                "port labels missing",
                circuit.apply(
                    "{\"type\":\"COMPOSITE_QUANTUM_GATE\",\"identifier\":\"BELL\",\"inverseForm\":false," +
                        qubits +
                        ",\"controlQubits\":[]}"
                ),
                422,
                "port labels"
            ),
            org.junit.jupiter.params.provider.Arguments.of(
                "qubits missing",
                circuit.apply(
                    "{\"type\":\"COMPOSITE_QUANTUM_GATE\",\"identifier\":\"BELL\",\"inverseForm\":false,\"portLabels\":[\"a\",\"b\"],\"controlQubits\":[]}"
                ),
                422,
                "qubits"
            ),
            org.junit.jupiter.params.provider.Arguments.of(
                "type discriminator missing",
                circuit.apply("{\"identifier\":\"BELL\",\"inverseForm\":false," + qubits + ",\"controlQubits\":[]}"),
                400,
                "could not be read"
            ),
            org.junit.jupiter.params.provider.Arguments.of(
                "null entry in body",
                circuit.apply(
                    "{\"type\":\"COMPOSITE_QUANTUM_GATE\",\"identifier\":\"BELL\",\"inverseForm\":false," +
                        qubits +
                        ",\"controlQubits\":[],\"portLabels\":[\"a\",\"b\"],\"body\":[null]}"
                ),
                422,
                "empty operation"
            )
        );
    }

    /** Without a fileId the endpoint stays content-only, so an unresolvable include is a 400. */
    @Test
    void parseQasmCode_UnresolvableInclude_ShouldReturnBadRequest() throws Exception {
        String main = """
            OPENQASM 3.0;
            include "bell.qasm";
            qubit[2] q;
            """;

        mockMvc
            .perform(post("/api/circuit/parse").with(csrf()).contentType(MediaType.TEXT_PLAIN).content(main))
            .andExpect(status().isBadRequest());
    }

    @Test
    void parseQasmCode_InvalidCode_ShouldReturnBadRequest() throws Exception {
        mockMvc
            .perform(post("/api/circuit/parse").with(csrf()).contentType(MediaType.TEXT_PLAIN).content("qubit[2 q; oops"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void addQubit_ShouldReturnCreated() throws Exception {
        // Arrange
        String projectId = "p-id";
        String circuitId = "c-id";
        QuantumCircuit circuit = new QuantumCircuit(projectId, "f-1");
        circuit.setId(circuitId);
        String registerId = circuit.getRegisters().getFirst().getId();
        circuit.addQubit(registerId);

        given(circuitServicePort.getById(circuitId)).willReturn(circuit);
        given(circuitServicePort.addQubit(eq(circuitId), eq(registerId), any())).willReturn(circuit);

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
        QuantumCircuit updatedCircuit = new QuantumCircuit(projectId, "f-1");
        updatedCircuit.setId(circuitId);

        given(circuitServicePort.getById(circuitId)).willReturn(updatedCircuit);
        given(circuitServicePort.removeQubit(eq(circuitId), eq(registerId), eq(qubitIdx), any())).willReturn(updatedCircuit);

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
        QuantumCircuit existingCircuit = new QuantumCircuit(projectId, "f-1");
        existingCircuit.setId(circuitId);
        QuantumCircuit freshCircuit = new QuantumCircuit(projectId, "f-1");

        given(circuitServicePort.getById(circuitId)).willReturn(existingCircuit);
        given(circuitServicePort.resetCircuit(eq(circuitId), any())).willReturn(freshCircuit);

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
        QuantumCircuit circuit = new QuantumCircuit(projectId, "f-1");
        circuit.setId(circuitId);
        String registerId = circuit.getRegisters().getFirst().getId();
        circuit.addQubit(registerId);
        ElementSelector target = new ElementSelector(registerId, 0);
        ElementaryQuantumGate operation = new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(target), null, 0d);
        int layerIdx = 0;
        circuit.addQuantumOperation(operation, layerIdx);

        given(circuitServicePort.getById(circuitId)).willReturn(circuit);
        given(circuitServicePort.addQuantumOperation(eq(circuitId), any(QuantumOperation.class), eq(layerIdx), any())).willReturn(circuit);

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

    @Test
    void addSubcircuitOperation_ShouldReturnCreated() throws Exception {
        // Arrange
        String projectId = "p-id";
        String circuitId = "c-id";
        QuantumCircuit circuit = new QuantumCircuit(projectId, "f-1");
        circuit.setId(circuitId);
        String registerId = circuit.getRegisters().getFirst().getId();
        circuit.addQubit(registerId);
        ElementSelector target0 = new ElementSelector(registerId, 0);
        ElementSelector target1 = new ElementSelector(registerId, 1);
        SubcircuitOperation operation = new SubcircuitOperation(false, List.of(target0, target1), null, "subcircuit-99");
        int layerIdx = 0;
        circuit.addQuantumOperation(operation, layerIdx);

        given(circuitServicePort.getById(circuitId)).willReturn(circuit);
        given(circuitServicePort.addQuantumOperation(eq(circuitId), any(QuantumOperation.class), eq(layerIdx), any())).willReturn(circuit);

        String payload = """
            {
                "quantumOperation": {
                    "type": "SUBCIRCUIT_OPERATION",
                    "definitionCircuitId": "subcircuit-99",
                    "inverseForm": false,
                    "targetQubits": [
                        {
                            "registerId": "%s",
                            "index": 0
                        },
                        {
                            "registerId": "%s",
                            "index": 1
                        }
                    ],
                    "controlQubits": null
                },
                "layerIdx": 0
            }
            """.formatted(registerId, registerId);

        // Act & Assert
        mockMvc
            .perform(
                post("/api/circuit/{circuitId}/operation", circuitId).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(payload)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.layers").exists())
            .andExpect(jsonPath("$.layers").isArray())
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].type").value("SUBCIRCUIT_OPERATION"))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].definitionCircuitId").value("subcircuit-99"))
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].id").value(operation.getId()));
    }
}
