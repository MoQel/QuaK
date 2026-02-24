package edu.kit.quak.integration.circuit;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@IntegrationTest
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CircuitLifecycleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("E2E: Full Circuit Lifecycle with multi-qubit gates and state verification")
    void testFullCircuitLifecycle() throws Exception {
        // 1. Create circuit
        MvcResult initResult = mockMvc
            .perform(post("/api/circuit").with(authenticatedUser()).with(csrf()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andReturn();

        CircuitResponse circuit = objectMapper.readValue(initResult.getResponse().getContentAsString(), CircuitResponse.class);
        String circuitId = circuit.id();
        String registerId = circuit.registers().getFirst().getId();

        // 2. Add qubit to circuit
        mockMvc
            .perform(post("/api/circuit/" + circuitId + "/register/" + registerId).with(authenticatedUser()).with(csrf()))
            .andExpect(status().isCreated());

        // 3. Add H-Gate to Layer 0 on Qubit 0
        String hGateJson = buildGateJson("H", registerId, 0, null);
        MvcResult addHGateResult = mockMvc
            .perform(
                post("/api/circuit/" + circuitId + "/operation")
                    .with(authenticatedUser())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(hGateJson)
            )
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode hGateNode = objectMapper.readTree(addHGateResult.getResponse().getContentAsString());
        String hGateId = hGateNode.at("/layers/0/quantumOperations/0/id").asText();

        // 4. Add CX-Gate to Layer 0 on Qubits 1 and 2 (Avoids collision with Qubit 0)
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
        String cxGateId = cxGateNode.at("/layers/0/quantumOperations/1/id").asText();

        // 5. Move CX-Gate to target Qubit 0.
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

        // 6. Verify circuit state via GET
        mockMvc
            .perform(get("/api/circuit/" + circuitId).with(authenticatedUser()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.layers.length()").value(2)) // Now correctly separated
            .andExpect(jsonPath("$.layers[0].quantumOperations[0].identifier").value("H"))
            .andExpect(jsonPath("$.layers[1].quantumOperations[0].identifier").value("CX"))
            .andExpect(jsonPath("$.layers[1].quantumOperations[0].targetQubits[0].index").value(0));

        // 7. Remove operations
        mockMvc
            .perform(delete("/api/circuit/" + circuitId + "/operation/" + hGateId).with(authenticatedUser()).with(csrf()))
            .andExpect(status().isOk());
        mockMvc
            .perform(delete("/api/circuit/" + circuitId + "/operation/" + cxGateId).with(authenticatedUser()).with(csrf()))
            .andExpect(status().isOk());

        // 8. Remove qubit
        mockMvc
            .perform(delete("/api/circuit/" + circuitId + "/register/" + registerId + "/0").with(authenticatedUser()).with(csrf()))
            .andExpect(status().isOk());

        // 9. Delete circuit
        mockMvc.perform(delete("/api/circuit/" + circuitId).with(authenticatedUser()).with(csrf())).andExpect(status().isOk());

        // 10. Verify deletion (Expect 404)
        mockMvc.perform(get("/api/circuit/" + circuitId).with(authenticatedUser())).andExpect(status().isNotFound());
    }

    // --- Helper Methods ---

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
