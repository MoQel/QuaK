package edu.kit.quak.infrastructure.editorstate.in.event;

import edu.kit.quak.application.editorstate.ports.in.EditorStateServicePort;
import edu.kit.quak.core.user.event.UserDeletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Removes the editor states of a deleted user. */
@Component
public class UserDeletedEditorStateListener {

    private final EditorStateServicePort editorStateService;

    public UserDeletedEditorStateListener(EditorStateServicePort editorStateService) {
        this.editorStateService = editorStateService;
    }

    @EventListener
    public void onUserDeleted(UserDeletedEvent event) {
        editorStateService.deleteAllByUserId(event.userId());
    }
}
