package edu.kit.quak.integration.filesystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(username = "integration-user", roles = "USER")
class ProjectLifecycleIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    @DisplayName("E2E: Create Project -> Create Directory -> Upload File")
    void testFullLifecycle() throws Exception {
        // 1. Create project
        String projectJson = """
            { "name": "Integration Project" }
            """;

        MvcResult projectResult = mockMvc.perform(post("/project")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectJson))
                .andExpect(status().isCreated())
                .andReturn();

        // Extract ID from the response
        ProjectDetailsResponse project = objectMapper.readValue(
                projectResult.getResponse().getContentAsString(),
                ProjectDetailsResponse.class
        );
        String projectId = project.id();

        // 2. Create directory in the project
        String dirJson = """
            { "name": "Docs" }
            """;

        MvcResult dirResult = mockMvc.perform(post("/directory/")
                        .with(csrf())
                        .header("parent-id", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dirJson))
                .andExpect(status().isCreated())
                .andReturn();

        DirectoryDetailsResponse directory = objectMapper.readValue(
                dirResult.getResponse().getContentAsString(),
                DirectoryDetailsResponse.class
        );
        String dirId = directory.getId();

        // 3. Create file in directory
        String fileJson = """
            {\s
                "name": "specs.pdf",
                "contentType": "application/pdf"
            }
           \s""";

        mockMvc.perform(post("/file/")
                        .with(csrf())
                        .header("parent-id", dirId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fileJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("specs.pdf"));

        // 4. Check whether the project now has content (GET)
        mockMvc.perform(get("/project/" + projectId))
                .andExpect(status().isOk())
                // Should the directory contain
                .andExpect(jsonPath("$.contents[0].id").value(dirId));
    }
}
