package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.FileDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import edu.kit.quak.shared.tags.IntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
@WebMvcTest(FileRestAdapter.class)
@org.springframework.context.annotation.ComponentScan(basePackageClasses = {FileDtoMapper.class})
@WithMockUser(username = "tester", roles = "USER") // Simulates logged-in user
class FileRestAdapterTest {

    @Autowired MockMvc mockMvc;

    @MockitoBean FileServicePort fileService;

    @MockitoBean UserServicePort userService;

    @MockitoBean AuthenticationMapper authenticationMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        AuthenticatedUser testAuthUser =
                new AuthenticatedUser(UUID.randomUUID(), "github", "tester");
        testUser = new User(testAuthUser.userId(), testAuthUser.issuer(), testAuthUser.subject());

        when(authenticationMapper.toDomain(any())).thenReturn(testAuthUser);
        when(userService.getAuthenticatedUser(any(AuthenticatedUser.class))).thenReturn(testUser);
    }

    @Test
    @DisplayName("POST /file/ creates file successfully (check validation & CSRF)")
    void createFile_success() throws Exception {
        File createdFile = new File("test.txt", null);
        createdFile.setId("f-123");

        when(fileService.createFile(any(File.class), eq("d-1"), any(User.class)))
                .thenReturn(createdFile);

        String jsonRequest =
                """
                {
                    "name": "test.txt",
                    "contentType": "text/plain"
                }
                """;

        mockMvc.perform(
                        post("/api/file/")
                                .with(csrf())
                                .header(ApiConstants.HEADER_PARENT_ID, "d-1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("f-123"))
                .andExpect(jsonPath("$.name").value("test.txt"))
                .andExpect(jsonPath("$.type").value("file"));
    }

    @Test
    @DisplayName("POST /file/ returns 400 on invalid content-type format")
    void createFile_validationError() throws Exception {
        // "invalid-type" does not match the regex in the DTO
        String jsonRequest =
                """
                {
                    "name": "test.txt",
                    "contentType": "invalid-type"
                }
                """;

        mockMvc.perform(
                        post("/api/file/")
                                .with(csrf())
                                .header(ApiConstants.HEADER_PARENT_ID, "d-1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(jsonRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").exists())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("GET /file/{id} returns file details")
    void retrieveFile_success() throws Exception {
        File file = new File("image.png", null);
        file.setId("f-555");

        when(fileService.retrieveFile(eq("f-555"), any(User.class))).thenReturn(file);

        mockMvc.perform(get("/api/file/f-555"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("f-555"))
                .andExpect(jsonPath("$.name").value("image.png"));
    }

    @Test
    @DisplayName("DELETE /file/{id} removes file")
    void deleteFile_success() throws Exception {
        mockMvc.perform(delete("/api/file/f-123").with(csrf())).andExpect(status().isOk());

        verify(fileService).removeFile(eq("f-123"), any(User.class));
    }

    @Test
    @DisplayName("PATCH /file/{id} renames file")
    void renameFile_success() throws Exception {
        File updatedFile = new File("renamed.txt", null);
        updatedFile.setId("f-123");

        when(fileService.renameFile(eq("f-123"), eq("renamed.txt"), any(User.class)))
                .thenReturn(updatedFile);

        String jsonRequest = """
                { "name": "renamed.txt" }
                """;

        mockMvc.perform(
                        patch("/api/file/f-123")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(jsonRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("renamed.txt"));
    }

    @Test
    @DisplayName("GET /file/{id}/content returns byte array (Base64 in JSON)")
    void getFileContent_success() throws Exception {
        byte[] content = "Hello World".getBytes();
        when(fileService.getFileContent(eq("f-123"), any(User.class))).thenReturn(content);

        mockMvc.perform(get("/api/file/f-123/content"))
                .andExpect(status().isOk())
                // Jackson automatically serializes byte[] as a Base64 string
                .andExpect(jsonPath("$.content").isNotEmpty());
    }

    @Test
    @DisplayName("PUT /file/{id}/content updates content")
    void setFileContent_success() throws Exception {
        // "SGVsbG8=" ist Base64 für "Hello"
        String jsonRequest =
                """
                {
                    "content": "SGVsbG8=",
                    "contentType": "text/plain"
                }
                """;

        mockMvc.perform(
                        put("/api/file/f-123/content")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(jsonRequest))
                .andExpect(status().isOk());

        verify(fileService)
                .setFileContent(eq("f-123"), any(byte[].class), eq("text/plain"), any(User.class));
    }
}
