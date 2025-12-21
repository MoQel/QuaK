package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.ProjectDtoMapper;
import edu.kit.quak.shared.tags.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@IntegrationTest
@WebMvcTest(ProjectRestAdapter.class)
@org.springframework.context.annotation.ComponentScan(basePackageClasses = {
        ProjectDtoMapper.class
})
@WithMockUser(username = "tester", roles = "USER") // simulates logged-in user
class ProjectRestAdapterTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ProjectServicePort projectService;

    @MockitoBean
    edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper authMapper;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        // Mock the authMapper to return a test AuthenticatedUser for any Authentication
        AuthenticatedUser testAuthUser = new AuthenticatedUser(
                java.util.UUID.randomUUID(),
                "test",
                "test-sub");
        when(authMapper.toDomain(any(org.springframework.security.core.Authentication.class)))
                .thenReturn(testAuthUser);
    }

    @Test
    @DisplayName("GET /project returns list of projects")
    void getProjects_success() throws Exception {
        Project p1 = new Project("Alpha");
        p1.setId("p-1");
        Project p2 = new Project("Beta");
        p2.setId("p-2");

        when(projectService.listProjects(any(AuthenticatedUser.class))).thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/api/project"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Alpha"))
                .andExpect(jsonPath("$[1].name").value("Beta"));
    }

    @Test
    @DisplayName("POST /project creates new project (check CSRF)")
    void createProject_success() throws Exception {
        Project createdProject = new Project("New Project");
        createdProject.setId("p-100");

        when(projectService.createProject(any(Project.class), any(AuthenticatedUser.class)))
                .thenReturn(createdProject);

        String jsonRequest = """
                { "name": "New Project" }
                """;

        mockMvc.perform(post("/api/project")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("p-100"))
                .andExpect(jsonPath("$.name").value("New Project"));
    }

    @Test
    @DisplayName("GET /project/{id} returns project contents")
    void retrieveProject_success() throws Exception {
        Project project = new Project("MyProject");
        project.setId("p-1");

        when(projectService.retrieveProject(eq("p-1"), any(AuthenticatedUser.class)))
                .thenReturn(project);

        mockMvc.perform(get("/api/project/p-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("p-1"))
                .andExpect(jsonPath("$.name").value("MyProject"));
    }

    @Test
    @DisplayName("DELETE /project/{id} removes project")
    void deleteProject_success() throws Exception {
        mockMvc.perform(delete("/api/project/p-1")
                .with(csrf())) // WICHTIG: CSRF Token
                .andExpect(status().isOk());

        verify(projectService).removeProject(eq("p-1"), any(AuthenticatedUser.class));
    }

    @Test
    @DisplayName("PATCH /project/{id} renames project")
    void renameProject_success() throws Exception {
        Project updatedProject = new Project("Renamed Project");
        updatedProject.setId("p-1");

        when(projectService.renameProject(eq("p-1"), eq("Renamed Project"), any(AuthenticatedUser.class)))
                .thenReturn(updatedProject);

        String jsonRequest = """
                { "name": "Renamed Project" }
                """;

        mockMvc.perform(patch("/api/project/p-1")
                .with(csrf()) // WICHTIG: CSRF Token
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Project"));
    }
}