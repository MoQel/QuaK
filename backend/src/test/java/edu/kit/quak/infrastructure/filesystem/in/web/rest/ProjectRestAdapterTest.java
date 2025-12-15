package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.DirectoryDtoMapperImpl;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.FileDtoMapperImpl;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.FileElementDtoMapperImpl;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.ProjectDtoMapperImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProjectRestAdapter.class)
@Import({
        ProjectDtoMapperImpl.class,
        FileElementDtoMapperImpl.class,
        DirectoryDtoMapperImpl.class,
        FileDtoMapperImpl.class
})
@WithMockUser(username = "tester", roles = "USER") // simulates logged-in user
class ProjectRestAdapterTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ProjectServicePort projectService;

    @Test
    @DisplayName("GET /project returns list of projects")
    void getProjects_success() throws Exception {
        Project p1 = new Project("Alpha");
        p1.setId("p-1");
        Project p2 = new Project("Beta");
        p2.setId("p-2");

        when(projectService.listProjects()).thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/project"))
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

        when(projectService.createProject(any(Project.class))).thenReturn(createdProject);

        String jsonRequest = """
            { "name": "New Project" }
            """;

        mockMvc.perform(post("/project")
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

        // Service returns Object directly (no Optional), based on your Exception Handling Refactoring
        when(projectService.retrieveProject("p-1")).thenReturn(project);

        mockMvc.perform(get("/project/p-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("p-1"))
                .andExpect(jsonPath("$.name").value("MyProject"));
    }

    @Test
    @DisplayName("DELETE /project/{id} removes project")
    void deleteProject_success() throws Exception {
        mockMvc.perform(delete("/project/p-1")
                        .with(csrf())) // WICHTIG: CSRF Token
                .andExpect(status().isOk());

        verify(projectService).removeProject("p-1");
    }

    @Test
    @DisplayName("PATCH /project/{id} renames project")
    void renameProject_success() throws Exception {
        Project updatedProject = new Project("Renamed Project");
        updatedProject.setId("p-1");

        when(projectService.renameProject("p-1", "Renamed Project"))
                .thenReturn(updatedProject);

        String jsonRequest = """
            { "name": "Renamed Project" }
            """;

        mockMvc.perform(patch("/project/p-1")
                        .with(csrf()) // WICHTIG: CSRF Token
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Project"));
    }
}