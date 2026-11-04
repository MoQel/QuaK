package edu.kit.quak.infrastructure.editorstate.in.event;

import edu.kit.quak.application.editorstate.ports.in.EditorStateServicePort;
import edu.kit.quak.core.user.event.GuestUpgradedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Moves the editor states of an upgraded guest to its new account. */
@Component
public class GuestUpgradedEditorStateListener {

    private final EditorStateServicePort editorStateService;

    public GuestUpgradedEditorStateListener(EditorStateServicePort editorStateService) {
        this.editorStateService = editorStateService;
    }

    @EventListener
    public void onGuestUpgraded(GuestUpgradedEvent event) {
        editorStateService.transferAllByUserId(event.guestId(), event.accountId());
    }
}
