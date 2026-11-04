package edu.kit.quak.infrastructure.editorstate.in.event;

import edu.kit.quak.application.editorstate.ports.in.EditorStateServicePort;
import edu.kit.quak.core.filesystem.event.ProjectDeletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Removes the editor states of all users for a deleted project. */
@Component
public class ProjectDeletedEditorStateListener {

    private final EditorStateServicePort editorStateService;

    public ProjectDeletedEditorStateListener(EditorStateServicePort editorStateService) {
        this.editorStateService = editorStateService;
    }

    @EventListener
    public void onProjectDeleted(ProjectDeletedEvent event) {
        editorStateService.deleteAllByProjectId(event.projectId());
    }
}
