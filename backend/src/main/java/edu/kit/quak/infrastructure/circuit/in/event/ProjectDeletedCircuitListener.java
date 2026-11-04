package edu.kit.quak.infrastructure.circuit.in.event;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.core.filesystem.event.ProjectDeletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Removes the circuits of a deleted project. */
@Component
public class ProjectDeletedCircuitListener {

    private final CircuitServicePort circuitService;

    public ProjectDeletedCircuitListener(CircuitServicePort circuitService) {
        this.circuitService = circuitService;
    }

    @EventListener
    public void onProjectDeleted(ProjectDeletedEvent event) {
        circuitService.deleteAllByProjectId(event.projectId());
    }
}
