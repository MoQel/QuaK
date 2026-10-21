package edu.kit.quak.infrastructure.filesystem.in.event;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.core.user.event.GuestUpgradedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Moves the projects of an upgraded guest to its new account. */
@Component
public class GuestUpgradedProjectListener {

    private final ProjectServicePort projectService;

    public GuestUpgradedProjectListener(ProjectServicePort projectService) {
        this.projectService = projectService;
    }

    @EventListener
    public void onGuestUpgraded(GuestUpgradedEvent event) {
        projectService.transferAllByOwnerId(event.guestId(), event.accountId());
    }
}
