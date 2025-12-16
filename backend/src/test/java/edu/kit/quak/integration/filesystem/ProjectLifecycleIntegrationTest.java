package edu.kit.quak.integration.filesystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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

    private String projectId;
    private String dirId;
    private String fileId;

    @BeforeEach
    void setUp() throws Exception {
        // --- 1. Create Project ---
        String projectJson = """
            { "name": "Integration Project" }
            """;

        MvcResult projectResult = mockMvc.perform(post("/project")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(projectJson))
                .andExpect(status().isCreated())
                .andReturn();

        ProjectDetailsResponse project = objectMapper.readValue(
                projectResult.getResponse().getContentAsString(),
                ProjectDetailsResponse.class
        );
        this.projectId = project.id();

        // --- 2. Create Directory ---
        String dirJson = """
            { "name": "Docs" }
            """;

        MvcResult dirResult = mockMvc.perform(post("/directory/")
                        .with(csrf())
                        .header("parent-id", this.projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dirJson))
                .andExpect(status().isCreated())
                .andReturn();

        DirectoryDetailsResponse directory = objectMapper.readValue(
                dirResult.getResponse().getContentAsString(),
                DirectoryDetailsResponse.class
        );
        this.dirId = directory.getId();

        // --- 3. Create File ---
        String fileJson = """
            {
                "name": "specs.pdf",
                "contentType": "application/pdf"
            }
            """;

        MvcResult fileResult = mockMvc.perform(post("/file/")
                        .with(csrf())
                        .header("parent-id", this.dirId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fileJson))
                .andExpect(status().isCreated())
                .andReturn();

        FileDetailsResponse file = objectMapper.readValue(
                fileResult.getResponse().getContentAsString(),
                FileDetailsResponse.class
        );
        this.fileId = file.getId();
    }

    @Test
    @DisplayName("E2E: Create Project -> Create Directory -> Upload File")
    void testFullLifecycle() throws Exception {

        // Check whether the project now has content (GET)
        mockMvc.perform(get("/project/" + projectId))
                .andExpect(status().isOk())
                // Should the directory contain
                .andExpect(jsonPath("$.contents[0].id").value(dirId));

        // Delete Project (Cascading Delete Test)
        mockMvc.perform(delete("/project/" + projectId)
                        .with(csrf()))
                .andExpect(status().isOk());

        // Verify that the file is also gone (Accessing file should return 404)
        mockMvc.perform(get("/file/" + fileId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("E2E: File Content Lifecycle (Upload -> Download -> Update)")
    void testFileContentOperations() throws Exception {
        // Upload Content (PUT)
        String contentBase64 = "SGVsbG8gV29ybGQ="; // "Hello World" in Base64
        String updateJson = """
            {\s
                "content": "%s",\s
                "contentType": "text/plain"\s
            }
           \s""".formatted(contentBase64);

        mockMvc.perform(put("/file/" + fileId + "/content")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk());

        // 3. Download Content (GET)
        mockMvc.perform(get("/file/" + fileId + "/content"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value(contentBase64));
    }

    @Test
    @DisplayName("E2E: Prevent Duplicate Filenames (Domain Logic Check)")
    void testDuplicateFilenamePrevention() throws Exception {
        String duplicateFileJson = """
            {
                "name": "specs.pdf",
                "contentType": "application/pdf"
            }
            """;

        mockMvc.perform(post("/file/")
                        .with(csrf())
                        .header("parent-id", this.dirId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateFileJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("already exists")));
    }

    @Test
    @DisplayName("E2E: Rename File and Directory")
    void testRenameEntities() throws Exception {
        // 1. Rename File "specs.pdf" -> "architecture.pdf"
        String renameFileJson = """
            { "name": "architecture.pdf" }
            """;

        mockMvc.perform(patch("/file/" + this.fileId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(renameFileJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("architecture.pdf"));

        // 2. Rename Directory "Docs" -> "References"
        String renameDirJson = """
            { "name": "References" }
            """;

        mockMvc.perform(patch("/directory/" + this.dirId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(renameDirJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("References"));
    }

    @Test
    @DisplayName("E2E: Nested Directories (Deep Hierarchy)")
    void testNestedStructure() throws Exception {
        String subDirJson = """
            { "name": "SubFolder" }
            """;

        MvcResult result = mockMvc.perform(post("/directory/")
                        .with(csrf())
                        .header("parent-id", this.dirId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(subDirJson))
                .andExpect(status().isCreated())
                .andReturn();

        DirectoryDetailsResponse subDir = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                DirectoryDetailsResponse.class
        );

        String deepFileJson = """
            { "name": "deep.txt", "contentType": "text/plain" }
            """;

        mockMvc.perform(post("/file/")
                        .with(csrf())
                        .header("parent-id", subDir.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deepFileJson))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("E2E: Accessing Non-Existent Resource returns 404")
    @Disabled
        // TODO: Fix Exception Handling
    void testNotFoundHandling() throws Exception {
        mockMvc.perform(get("/file/f-999999999-non-existent"))
                .andExpect(status().isNotFound()); // Expects 404

        mockMvc.perform(delete("/directory/d-999999999")
                        .with(csrf()))
                .andExpect(status().isNotFound()); // Expects 404
    }
}
