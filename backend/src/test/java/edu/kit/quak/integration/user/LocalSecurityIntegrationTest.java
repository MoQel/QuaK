package edu.kit.quak.integration.user;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@IntegrationTest
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class LocalSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void localProfileAuthenticatesRequestsWithoutCredentials() throws Exception {
        mockMvc
            .perform(get("/api/auth/user"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.authenticated").value(true))
            .andExpect(jsonPath("$.userId").isNotEmpty());

        mockMvc
            .perform(get("/api/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("admin@quak.local"))
            .andExpect(jsonPath("$.name").value("Developer Admin"));
    }

    @Test
    void localUserCanManageProjectsWithoutCredentialsOrCsrfToken() throws Exception {
        String projectName = "Local Project " + UUID.randomUUID();
        MvcResult createResult = mockMvc
            .perform(
                post("/api/project")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.createObjectNode().put("name", projectName).toString())
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value(projectName))
            .andReturn();

        JsonNode createdProject = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String projectId = createdProject.get("id").asText();

        mockMvc.perform(get("/api/project")).andExpect(status().isOk()).andExpect(jsonPath("$[*].id", hasItem(projectId)));

        mockMvc.perform(get("/api/project/{projectId}", projectId)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(projectId));

        String renamedProject = projectName + " Renamed";
        mockMvc
            .perform(
                patch("/api/project/{projectId}", projectId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.createObjectNode().put("name", renamedProject).toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value(renamedProject));

        mockMvc.perform(delete("/api/project/{projectId}", projectId)).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/project")).andExpect(status().isOk()).andExpect(jsonPath("$[*].id", not(hasItem(projectId))));
    }
}
