package edu.kit.quak.integration.filesystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.ApiConstants;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataUserRepository;
import edu.kit.quak.shared.tags.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
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

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@IntegrationTest
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProjectLifecycleIntegrationTest {

        @Autowired
        MockMvc mockMvc;

        @Autowired
        ObjectMapper objectMapper;

        @Autowired
        private SpringDataUserRepository userRepository;

        @Autowired
        private jakarta.persistence.EntityManager entityManager;

        private String projectId;
        private String dirId;
        private String fileId;

        private OidcLoginRequestPostProcessor authenticatedUser() {
                return oidcLogin()
                                .idToken(token -> token
                                                .claim("sub", "test-sub")
                                                .claim("email", "test@example.com")
                                                .claim("name", "Test User"))
                                .clientRegistration(ClientRegistration
                                                .withRegistrationId("test")
                                                .clientId("test-client-id")
                                                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                                                .redirectUri("http://localhost/callback")
                                                .authorizationUri("http://localhost/authorize")
                                                .tokenUri("http://localhost/token")
                                                .build());
        }

        @BeforeEach
        void setUp() throws Exception {
                // Ensure user exists
                if (userRepository.findByIssuerAndSub("test", "test-sub").isEmpty()) {
                        JpaUser user = new JpaUser();
                        user.setIssuer("test");
                        user.setSub("test-sub");
                        user.setEmail("test@example.com");
                        user.setName("Test User");
                        userRepository.save(user);
                }

                // Flush user to DB so that constraints/foreign keys work if needed
                entityManager.flush();

                // --- 1. Create Project ---
                String projectJson = """
                                { "name": "Integration Project" }
                                """;

                MvcResult projectResult = mockMvc.perform(post("/api/project")
                                .with(authenticatedUser())
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(projectJson))
                                .andExpect(status().isCreated())
                                .andReturn();

                ProjectDetailsResponse project = objectMapper.readValue(
                                projectResult.getResponse().getContentAsString(),
                                ProjectDetailsResponse.class);
                this.projectId = project.id();

                // Flush to ensure project is visible to native queries
                entityManager.flush();

                // --- 2. Create Directory ---
                String dirJson = """
                                { "name": "Docs" }
                                """;

                MvcResult dirResult = mockMvc.perform(post("/api/directory/")
                                .with(authenticatedUser())
                                .with(csrf())
                                .header(ApiConstants.HEADER_PARENT_ID, this.projectId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(dirJson))
                                .andExpect(status().isCreated())
                                .andReturn();

                DirectoryDetailsResponse directory = objectMapper.readValue(
                                dirResult.getResponse().getContentAsString(),
                                DirectoryDetailsResponse.class);
                this.dirId = directory.getId();

                // Flush to ensure directory is visible to native queries
                entityManager.flush();

                // --- 3. Create File ---
                String fileJson = """
                                {
                                    "name": "specs.pdf",
                                    "contentType": "application/pdf"
                                }
                                """;

                MvcResult fileResult = mockMvc.perform(post("/api/file/")
                                .with(authenticatedUser())
                                .with(csrf())
                                .header(ApiConstants.HEADER_PARENT_ID, this.dirId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(fileJson))
                                .andExpect(status().isCreated())
                                .andReturn();

                FileDetailsResponse file = objectMapper.readValue(
                                fileResult.getResponse().getContentAsString(),
                                FileDetailsResponse.class);
                this.fileId = file.getId();
        }

        @Test
        @DisplayName("E2E: Create Project -> Create Directory -> Upload File")
        void testFullLifecycle() throws Exception {

                // Check whether the project now has content (GET)
                mockMvc.perform(get("/api/project/" + projectId).with(authenticatedUser()))
                                .andExpect(status().isOk())
                                // Should the directory contain
                                .andExpect(jsonPath("$.contents[0].id").value(dirId));

                // Delete Project (Cascading Delete Test)
                mockMvc.perform(delete("/api/project/" + projectId)
                                .with(authenticatedUser())
                                .with(csrf()))
                                .andExpect(status().isOk());

                // Verify that the file is also gone (Accessing file should return 404)
                mockMvc.perform(get("/api/file/" + fileId).with(authenticatedUser()))
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

                mockMvc.perform(put("/api/file/" + fileId + "/content")
                                .with(authenticatedUser())
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(updateJson))
                                .andExpect(status().isOk());

                // 3. Download Content (GET)
                mockMvc.perform(get("/api/file/" + fileId + "/content").with(authenticatedUser()))
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

                mockMvc.perform(post("/api/file/")
                                .with(authenticatedUser())
                                .with(csrf())
                                .header(ApiConstants.HEADER_PARENT_ID, this.dirId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(duplicateFileJson))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.detail")
                                                .value(org.hamcrest.Matchers.containsString("already exists")));
        }

        @Test
        @DisplayName("E2E: Rename File and Directory")
        void testRenameEntities() throws Exception {
                // 1. Rename File "specs.pdf" -> "architecture.pdf"
                String renameFileJson = """
                                { "name": "architecture.pdf" }
                                """;

                mockMvc.perform(patch("/api/file/" + this.fileId)
                                .with(authenticatedUser())
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(renameFileJson))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value("architecture.pdf"));

                // 2. Rename Directory "Docs" -> "References"
                String renameDirJson = """
                                { "name": "References" }
                                """;

                mockMvc.perform(patch("/api/directory/" + this.dirId)
                                .with(authenticatedUser())
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

                MvcResult result = mockMvc.perform(post("/api/directory/")
                                .with(authenticatedUser())
                                .with(csrf())
                                .header(ApiConstants.HEADER_PARENT_ID, this.dirId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(subDirJson))
                                .andExpect(status().isCreated())
                                .andReturn();

                DirectoryDetailsResponse subDir = objectMapper.readValue(
                                result.getResponse().getContentAsString(),
                                DirectoryDetailsResponse.class);

                String deepFileJson = """
                                { "name": "deep.txt", "contentType": "text/plain" }
                                """;

                mockMvc.perform(post("/api/file/")
                                .with(authenticatedUser())
                                .with(csrf())
                                .header(ApiConstants.HEADER_PARENT_ID, subDir.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(deepFileJson))
                                .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("E2E: Accessing Non-Existent Resource returns 404")
        @Disabled
        // TODO: Fix Exception Handling
        void testNotFoundHandling() throws Exception {
                mockMvc.perform(get("/api/file/f-999999999-non-existent").with(authenticatedUser()))
                                .andExpect(status().isNotFound()); // Expects 404

                mockMvc.perform(delete("/api/directory/d-999999999")
                                .with(authenticatedUser())
                                .with(csrf()))
                                .andExpect(status().isNotFound()); // Expects 404
        }
}
