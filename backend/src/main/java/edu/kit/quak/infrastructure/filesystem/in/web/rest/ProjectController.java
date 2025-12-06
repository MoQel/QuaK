package edu.kit.quak.infrastructure.web.rest;

import edu.kit.quak.application.filesystem.service.ProjectService;
import edu.kit.quak.application.filesystem.service.UserService;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.filesystem.model.User;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * This controller handles all the calls to the {@code /project/} endpoint.
 * See the API-documentation for further information.
 *
 * @author Henrik K
 */
@RestController
@RequestMapping("/api/project")
public class ProjectController {

    private final ProjectService projectService;
    private final UserService userService;

    public ProjectController(ProjectService projectService, UserService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }

    @GetMapping({"", "/"})
    @PreAuthorize("isAuthenticated()")
    public List<Project> getProjects(Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return projectService.getAllProjectsForUser(user);
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public Project createProject(@RequestBody Project project, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return projectService.createProject(project, user);
    }

    @GetMapping("/{pId}")
    @PreAuthorize("isAuthenticated()")
    public Project getProject(@PathVariable String pId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return projectService.getProject(pId, user);
    }

    @PatchMapping("/{pId}")
    @PreAuthorize("isAuthenticated()")
    public Project patchProject(@PathVariable String pId, @RequestBody Project modified, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return projectService.updateProject(pId, modified, user);
    }
    
    @DeleteMapping("/{pId}")
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public void deleteProject(@PathVariable String pId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        projectService.deleteProject(pId, user);
    }
}
