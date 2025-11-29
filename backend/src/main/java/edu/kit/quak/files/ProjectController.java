package edu.kit.quak.files;

import edu.kit.quak.files.model.Project;
import edu.kit.quak.files.repository.ProjectRepository;
import edu.kit.quak.files.repository.savers.FileElementSaversRepository;
import edu.kit.quak.security.model.User;
import edu.kit.quak.security.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedList;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;

/**
 * This controller handles all the calls to the {@code /project/} endpoint.
 * See the API-documentation for further information.
 *
 * @author Henrik K
 */
@RestController
@RequestMapping("/api/project")
public class ProjectController {

    private final ProjectRepository projects;
    private final FileElementSaversRepository savers;
    private final UserRepository users;

    public ProjectController(ProjectRepository projects, FileElementSaversRepository savers, UserRepository users) {
        this.projects = projects;
        this.savers = savers;
        this.users = users;
    }

    private User getUser(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken && 
            authentication.getPrincipal() instanceof OidcUser oidcUser) {
            String registrationId = oauthToken.getAuthorizedClientRegistrationId();
            String sub = oidcUser.getSubject();
            return users.findByIssuerAndSub(registrationId, sub)
                    .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "User not found"));
        }
        throw new ResponseStatusException(FORBIDDEN, "Not authenticated");
    }

    @GetMapping({"", "/"})
    public List<Project> getProjects(Authentication authentication) {
        User user = getUser(authentication);
        return projects.findAllByOwner(user);
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public Project createProject(@RequestBody Project project, Authentication authentication) {
        User user = getUser(authentication);
        project.setId(null);
        project.setOwner(user);
        if (!project.getElements().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "New Projects cannot already contain files");
        }
        return projects.save(project);
    }

    @GetMapping("/{pId}")
    public Project getProject(@PathVariable String pId, Authentication authentication) {
        User user = getUser(authentication);
        Project project = projects.findById(pId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given id does not map to a project")
        );
        if (project.getOwner() == null || !project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You do not own this project");
        }
        return project;
    }

    @PatchMapping("/{pId}")
    public Project patchProject(@PathVariable String pId, @RequestBody Project modified, Authentication authentication) {
        Project original = getProject(pId, authentication);
        try {
            original.patch(modified);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
        projects.save(original);
        return original;
    }
    
    @DeleteMapping("/{pId}")
    @Transactional
    public void deleteProject(@PathVariable String pId, Authentication authentication) {
        getProject(pId, authentication); // Check ownership
        savers.delete(pId, Project.class);
    }
}
