package edu.kit.quak.infrastructure.filesystem.in.event;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.core.user.event.UserDeletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Removes the projects of a deleted user. */
@Component
public class UserDeletedProjectListener {

    private final ProjectServicePort projectService;

    public UserDeletedProjectListener(ProjectServicePort projectService) {
        this.projectService = projectService;
    }

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        projectService.deleteAllByOwnerId(event.userId());
    }
}
