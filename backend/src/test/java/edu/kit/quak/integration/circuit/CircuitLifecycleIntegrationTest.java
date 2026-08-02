package edu.kit.quak.integration.circuit;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.shared.tags.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OidcLoginRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SuppressWarnings("null")
@IntegrationTest
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CircuitLifecycleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OidcSyncServicePort syncService;

    @Test
    @DisplayName("E2E: Full Circuit Lifecycle with multi-qubit gates and state verification")
    void testFullCircuitLifecycle() throws Exception {
        // 0. Ensure user exists
        syncService.syncUser("test", new OidcUserInfo("test-sub", "test@example.com", true, "Test User", null, null, null));

        // 1. Create Project
        String projectName = "Test Project";
        String projectRequest = """
            { "name": "%s" }
            """.formatted(projectName);

        MvcResult projectResult = mockMvc
            .perform(
                post("/api/project").with(authenticatedUser()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(projectRequest)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andReturn();

        JsonNode projectNode = objectMapper.readTree(projectResult.getResponse().getContentAsString());
        String projectId = projectNode.get("id").asText();

        // 2. Create a file and get its circuit (created on first access)
        String fileId = createFile(projectId);
        MvcResult circuitResult = mockMvc
            .perform(get("/api/circuit/file/" + fileId).with(authenticatedUser()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.projectId").value(projectId))
            .andReturn();

        CircuitResponse circuit = objectMapper.readValue(circuitResult.getResponse().getContentAsString(), CircuitResponse.class);
        String circuitId = circuit.id();
        String registerId = circuit.registers().getFirst().getId();

        // 3. Add qubit to circuit (by circuitId)
        mockMvc
            .perform(post("/api/circuit/" + circuitId + "/register/" + registerId).with(authenticatedUser()).with(csrf()))
            .andExpect(status().isCreated());

        // 4. Add H-Gate (Added this back, as it was missing but required for Step 7)
        String hGateJson = buildGateJson("H", registerId, 0, null);
        mockMvc
            .perform(
                post("/api/circuit/" + circuitId + "/operation")
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(hGateJson)
            )
            .andExpect(status().isCreated());

        // 5. Add CX-Gate to Layer 0 on Qubits 1 and 2 (Avoids collision with Qubit 0)
        String cxGateJson = buildGateJson("CX", registerId, 2, 1);
        MvcResult addCxGateResult = mockMvc
            .perform(
                post("/api/circuit/" + circuitId + "/operation")
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(cxGateJson)
            )
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode cxGateNode = objectMapper.readTree(addCxGateResult.getResponse().getContentAsString());
        // Locate the CX by identifier rather than a fixed index: the intra-layer order is an
        // implementation detail (the scheduler prepends, toCode/rendering re-sort by qubit).
        String cxGateId = findOperationId(cxGateNode, "CX");

        // 6. Move CX-Gate to target Qubit 0.
        // Causes collision with H-Gate, forcing CX into Layer 1.
        String moveJson = buildMoveJson(cxGateId, registerId);
        mockMvc
            .perform(
                patch("/api/circuit/" + circuitId + "/operation")
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(moveJson)
            )
            .andExpect(status().isOk());

        // 7. Verify circuit state via GET (by fileId)
        mockMvc
            .perform(get("/api/circuit/file/" + fileId).with(authenticatedUser()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.layers.length()").value(2)) // Now correctly separated
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].identifier").value("H"))
            .andExpect(jsonPath("$.layers[1].quantumOperations[0].identifier").value("CX"))
            .andExpect(jsonPath("$.layers[1].quantumOperations[0].targetQubits[0].index").value(0));

        // 8. Remove qubit
        mockMvc
            .perform(delete("/api/circuit/" + circuitId + "/register/" + registerId + "/0").with(authenticatedUser()).with(csrf()))
            .andExpect(status().isOk());

        // 9. Delete circuit
        mockMvc.perform(delete("/api/circuit/" + circuitId).with(authenticatedUser()).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("E2E: Direct Circuit Deletion by circuitId")
    void testDeleteCircuitDirectly() throws Exception {
        // 1. Create Project
        syncService.syncUser("test", new OidcUserInfo("test-sub", "test@example.com", true, "Test User", null, null, null));
        String projectRequest = """
            { "name": "Direct Delete Project" }
            """;
        MvcResult projectResult = mockMvc
            .perform(
                post("/api/project").with(authenticatedUser()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(projectRequest)
            )
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode projectNode = objectMapper.readTree(projectResult.getResponse().getContentAsString());
        String projectId = projectNode.get("id").asText();

        // 2. Create a file and get its circuit to find the circuit ID
        String fileId = createFile(projectId);
        MvcResult circuitResult = mockMvc
            .perform(get("/api/circuit/file/" + fileId).with(authenticatedUser()))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode circuitNode = objectMapper.readTree(circuitResult.getResponse().getContentAsString());
        String circuitId = circuitNode.get("id").asText();

        // 3. Delete the circuit directly by its ID
        mockMvc.perform(delete("/api/circuit/" + circuitId).with(authenticatedUser()).with(csrf())).andExpect(status().isNoContent());

        // 4. Verify the old circuit is gone: fetching by fileId creates a fresh one with a new ID
        mockMvc
            .perform(get("/api/circuit/file/" + fileId).with(authenticatedUser()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(org.hamcrest.Matchers.not(circuitId)));
    }

    @Test
    @DisplayName("E2E: Operation ids stay stable across full-replace saves; foreign ids are rejected")
    void testOperationIdStabilityOnReplace() throws Exception {
        syncService.syncUser("test", new OidcUserInfo("test-sub", "test@example.com", true, "Test User", null, null, null));
        MvcResult projectResult = mockMvc
            .perform(
                post("/api/project")
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        { "name": "Stable Ids Project" }
                        """
                    )
            )
            .andExpect(status().isCreated())
            .andReturn();
        String projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asText();

        // Circuit 1: PUT content with a client-chosen operation id — it must be persisted as-is.
        String fileId = createFile(projectId);
        JsonNode circuit = getCircuitByFile(fileId);
        String circuitId = circuit.get("id").asText();
        String registerId = circuit.at("/registers/0/id").asText();
        String clientOpId = "11111111-2222-3333-4444-555555555555";

        mockMvc
            .perform(
                put("/api/circuit/" + circuitId)
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(replaceContentJson(registerId, clientOpId))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].id").value(clientOpId));

        // Saving the same content again keeps the id (stable identity, no delete/insert churn).
        mockMvc
            .perform(
                put("/api/circuit/" + circuitId)
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(replaceContentJson(registerId, clientOpId))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].id").value(clientOpId));

        // Circuit 2 (different file): reusing circuit 1's operation id must be rejected.
        String otherFileId = createFile(projectId, "other.qasm");
        JsonNode otherCircuit = getCircuitByFile(otherFileId);
        String otherCircuitId = otherCircuit.get("id").asText();
        String otherRegisterId = otherCircuit.at("/registers/0/id").asText();

        mockMvc
            .perform(
                put("/api/circuit/" + otherCircuitId)
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(replaceContentJson(otherRegisterId, clientOpId))
            )
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("E2E: A repetition frame survives a save and comes back on the next read")
    void testLoopBlockRoundTrip() throws Exception {
        syncService.syncUser("test", new OidcUserInfo("test-sub", "test@example.com", true, "Test User", null, null, null));
        MvcResult projectResult = mockMvc
            .perform(
                post("/api/project")
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        { "name": "Loop Frame Project" }
                        """
                    )
            )
            .andExpect(status().isCreated())
            .andReturn();
        String projectId = objectMapper.readTree(projectResult.getResponse().getContentAsString()).get("id").asText();

        String fileId = createFile(projectId);
        JsonNode circuit = getCircuitByFile(fileId);
        String circuitId = circuit.get("id").asText();
        String registerId = circuit.at("/registers/0/id").asText();
        String operationId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        String blockId = "99999999-8888-7777-6666-555555555555";

        mockMvc
            .perform(
                put("/api/circuit/" + circuitId)
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(replaceContentJson(registerId, operationId, blockId, 5))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.loopBlocks[0].id").value(blockId))
            .andExpect(jsonPath("$.loopBlocks[0].repeatCount").value(5));

        // Read it back from the database rather than from the response of the write.
        mockMvc
            .perform(get("/api/circuit/file/" + fileId).with(authenticatedUser()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.loopBlocks.length()").value(1))
            .andExpect(jsonPath("$.loopBlocks[0].id").value(blockId))
            .andExpect(jsonPath("$.loopBlocks[0].repeatCount").value(5))
            .andExpect(jsonPath("$.loopBlocks[0].operationIds[0]").value(operationId));

        // A frame naming an operation the payload does not contain must not be stored.
        mockMvc
            .perform(
                put("/api/circuit/" + circuitId)
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(replaceContentJson(registerId, operationId, blockId, 5).replace(operationId + "\" ]", "ghost\" ]"))
            )
            .andExpect(status().isUnprocessableEntity());
    }

    // --- Helper Methods ---

    private JsonNode getCircuitByFile(String fileId) throws Exception {
        MvcResult result = mockMvc
            .perform(get("/api/circuit/file/" + fileId).with(authenticatedUser()))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    /** Full-replace payload: one H gate on qubit 0 with an explicit operation id. */
    private String replaceContentJson(String registerId, String operationId) {
        return """
        {
          "registers": [
            { "type": "Quantum_Register", "id": "%s", "name": "q", "numberOfQubits": 4 }
          ],
          "layers": [
            {
              "quantumOperations": [
                {
                  "type": "ELEMENTARY_QUANTUM_GATE",
                  "id": "%s",
                  "identifier": "H",
                  "inverseForm": false,
                  "targetQubits": [ { "registerId": "%s", "index": 0 } ],
                  "controlQubits": [],
                  "rotationAngle": 0.0
                }
              ]
            }
          ]
        }
        """.formatted(registerId, operationId, registerId);
    }

    /** The same payload plus a repetition frame over its single operation. */
    private String replaceContentJson(String registerId, String operationId, String blockId, int repeatCount) {
        String withoutFrame = replaceContentJson(registerId, operationId);
        String frame = """
            ,
              "loopBlocks": [
                { "id": "%s", "repeatCount": %d, "operationIds": [ "%s" ] }
              ]
            }
            """.formatted(blockId, repeatCount, operationId);
        return withoutFrame.stripTrailing().replaceAll("}$", "") + frame;
    }

    /** Creates a file directly under the project root and returns its id. */
    private String createFile(String projectId) throws Exception {
        return createFile(projectId, "main.qasm");
    }

    private String createFile(String projectId, String fileName) throws Exception {
        MvcResult fileResult = mockMvc
            .perform(
                post("/api/file/")
                    .with(authenticatedUser())
                    .with(csrf())
                    .header("parent-id", projectId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        { "name": "%s" }
                        """.formatted(fileName)
                    )
            )
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(fileResult.getResponse().getContentAsString()).get("id").asText();
    }

    /** Returns the id of the first operation with the given identifier, regardless of layer/position. */
    private String findOperationId(JsonNode circuit, String identifier) {
        for (JsonNode layer : circuit.at("/layers")) {
            for (JsonNode operation : layer.at("/quantumOperations")) {
                if (identifier.equals(operation.at("/identifier").asText())) {
                    return operation.at("/id").asText();
                }
            }
        }
        throw new AssertionError("No operation with identifier '" + identifier + "' found in circuit");
    }

    /**
     * Builds JSON for adding an elementary quantum gate.
     */
    private String buildGateJson(String gateName, String registerId, int targetIdx, Integer controlIdx) {
        String controlQubitsArray =
            controlIdx == null
                ? "[]"
                : """
                  [ { "registerId": "%s", "index": %d } ]
                  """.formatted(registerId, controlIdx);

        return """
        {
          "layerIdx": %d,
          "quantumOperation": {
            "type": "ELEMENTARY_QUANTUM_GATE",
            "identifier": "%s",
            "inverseForm": false,
            "targetQubits": [
              { "registerId": "%s", "index": %d }
            ],
            "controlQubits": %s,
            "rotationAngle": 0.0
          }
        }
        """.formatted(0, gateName, registerId, targetIdx, controlQubitsArray);
    }

    /**
     * Builds JSON for moving an existing quantum operation.
     */
    private String buildMoveJson(String operationId, String registerId) {
        String controlQubitsArray = """
            [ { "registerId": "%s", "index": %d } ]
            """.formatted(registerId, 1);

        return """
        {
          "quantumOperationId": "%s",
          "layerIdx": %d,
          "targetQubits": [
            { "registerId": "%s", "index": %d }
          ],
          "controlQubits": %s
        }
        """.formatted(operationId, 1, registerId, 0, controlQubitsArray);
    }

    private OidcLoginRequestPostProcessor authenticatedUser() {
        return oidcLogin()
            .idToken(token -> token.claim("sub", "test-sub").claim("email", "test@example.com").claim("name", "Test User"))
            .clientRegistration(
                ClientRegistration.withRegistrationId("test")
                    .clientId("test-client-id")
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("http://localhost/callback")
                    .authorizationUri("http://localhost/authorize")
                    .tokenUri("http://localhost/token")
                    .build()
            );
    }
}
