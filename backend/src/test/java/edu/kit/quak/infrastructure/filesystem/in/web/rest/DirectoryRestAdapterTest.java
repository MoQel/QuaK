package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.DirectoryDtoMapper;
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
@WebMvcTest(DirectoryRestAdapter.class)
@org.springframework.context.annotation.ComponentScan(basePackageClasses = {DirectoryDtoMapper.class})
@WithMockUser(username = "tester", roles = "USER") // <--- Simulates logged-in user
class DirectoryRestAdapterTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    DirectoryServicePort directoryService;

    @MockitoBean
    UserServicePort userService;

    @MockitoBean
    AuthenticationMapper authenticationMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        AuthenticatedUser testAuthUser = new AuthenticatedUser(UUID.randomUUID(), "github", "tester");
        testUser = new User(testAuthUser.userId(), testAuthUser.issuer(), testAuthUser.subject());

        when(authenticationMapper.toDomain(any())).thenReturn(testAuthUser);
        when(userService.getAuthenticatedUser(any(AuthenticatedUser.class))).thenReturn(testUser);
    }

    @Test
    @DisplayName("POST /directory/ creates directory and returns 201")
    void createDirectory() throws Exception {
        Directory createdDir = new Directory("NewDir", null);
        createdDir.setId("d-123");

        when(directoryService.createDirectory(any(Directory.class), eq("p-1"), any(User.class)))
                .thenReturn(createdDir);

        String json = """
                                { "name": "NewDir" }
                                """;

        mockMvc.perform(post("/api/directory/")
                        .with(csrf())
                        .header(ApiConstants.HEADER_PARENT_ID, "p-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("d-123"));
    }

    @Test
    @DisplayName("GET /directory/{quantumOperationId} returns contents")
    void retrieveDirectory() throws Exception {
        Directory dir = new Directory("MyDir", null);
        dir.setId("d-123");

        when(directoryService.retrieveDirectory(eq("d-123"), any(User.class))).thenReturn(dir);

        mockMvc.perform(get("/api/directory/d-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("d-123"));
    }

    @Test
    @DisplayName("DELETE /directory/{quantumOperationId} calls service")
    void deleteDirectory() throws Exception {
        mockMvc.perform(delete("/api/directory/d-123").with(csrf())).andExpect(status().isOk());

        verify(directoryService).removeDirectory(eq("d-123"), any(User.class));
    }

    @Test
    @DisplayName("PATCH /directory/{quantumOperationId} renames directory")
    void renameDirectory() throws Exception {
        Directory updated = new Directory("Renamed", null);
        updated.setId("d-123");

        when(directoryService.renameDirectory(eq("d-123"), eq("Renamed"), any(User.class)))
                .thenReturn(updated);

        String json = """
                                { "name": "Renamed" }
                                """;

        mockMvc.perform(patch("/api/directory/d-123")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed"));
    }
}
