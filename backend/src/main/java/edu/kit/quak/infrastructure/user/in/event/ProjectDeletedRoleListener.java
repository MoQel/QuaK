package edu.kit.quak.infrastructure.user.in.event;

import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.filesystem.event.ProjectDeletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Removes the role assignments of a deleted project. */
@Component
public class ProjectDeletedRoleListener {

    private final ProjectRoleServicePort roleService;

    public ProjectDeletedRoleListener(ProjectRoleServicePort roleService) {
        this.roleService = roleService;
    }

    @EventListener
    public void onProjectDeleted(ProjectDeletedEvent event) {
        roleService.deleteAllByProjectId(event.projectId());
    }
}
