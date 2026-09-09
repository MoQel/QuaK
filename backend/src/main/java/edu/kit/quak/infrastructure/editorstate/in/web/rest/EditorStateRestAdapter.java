package edu.kit.quak.infrastructure.editorstate.in.web.rest;

import edu.kit.quak.application.editorstate.ports.in.EditorStateServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.editorstate.model.EditorState;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.editorstate.in.web.rest.dto.EditorStateResponse;
import edu.kit.quak.infrastructure.editorstate.in.web.rest.dto.UpdateEditorStateRequest;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/editor-state")
public class EditorStateRestAdapter {

    private final EditorStateServicePort service;
    private final UserServicePort userService;
    private final AuthenticationMapper authMapper;

    public EditorStateRestAdapter(EditorStateServicePort service, UserServicePort userService, AuthenticationMapper authMapper) {
        this.service = service;
        this.userService = userService;
        this.authMapper = authMapper;
    }

    /**
     * Returns the authenticated user's saved editor state for the given project.
     * Responds with a null tabsJson when no state was saved yet.
     */
    @GetMapping("/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public EditorStateResponse getByProjectId(@PathVariable String projectId, Authentication authentication) {
        log.debug("REST request to get editor state for project: {}", projectId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        return new EditorStateResponse(projectId, service.getByProjectId(projectId, user).map(EditorState::getTabsJson).orElse(null));
    }

    /** Creates or updates the authenticated user's editor state for the given project. */
    @PutMapping("/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public EditorStateResponse save(
        @PathVariable String projectId,
        @RequestBody UpdateEditorStateRequest request,
        Authentication authentication
    ) {
        log.debug("REST request to save editor state for project: {}", projectId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));

        EditorState state;
        try {
            state = service.save(projectId, request.tabsJson(), user);
        } catch (DataIntegrityViolationException ex) {
            // Two concurrent first-time saves race on the unique (projectId, userId) row; the loser
            // retries in a fresh transaction, where the row now exists and is updated instead of inserted.
            log.debug("Concurrent editor-state insert for project {}, retrying as update", projectId);
            state = service.save(projectId, request.tabsJson(), user);
        }
        return new EditorStateResponse(state.getProjectId(), state.getTabsJson());
    }
}
