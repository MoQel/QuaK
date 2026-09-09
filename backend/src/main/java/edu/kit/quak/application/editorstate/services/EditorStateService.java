package edu.kit.quak.application.editorstate.services;

import edu.kit.quak.application.common.exceptions.AccessDeniedException;
import edu.kit.quak.application.editorstate.ports.in.EditorStateServicePort;
import edu.kit.quak.application.editorstate.ports.out.EditorStateRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.editorstate.model.EditorState;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.User;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class EditorStateService implements EditorStateServicePort {

    private final EditorStateRepositoryPort repository;
    private final ProjectRoleServicePort projectRoleService;

    public EditorStateService(EditorStateRepositoryPort repository, ProjectRoleServicePort projectRoleService) {
        this.repository = repository;
        this.projectRoleService = projectRoleService;
    }

    @Override
    public Optional<EditorState> getByProjectId(String projectId, User user) {
        verifyAccess(projectId, user);
        return repository.findByProjectIdAndUserId(projectId, user.getId().toString());
    }

    @Override
    public EditorState save(String projectId, String tabsJson, User user) {
        verifyAccess(projectId, user);
        log.debug("Saving editor state. projectId={}, userId={}", projectId, user.getId());

        EditorState state = repository
            .findByProjectIdAndUserId(projectId, user.getId().toString())
            .orElseGet(() -> new EditorState(projectId, user.getId().toString(), tabsJson));
        state.setTabsJson(tabsJson);
        return repository.save(state);
    }

    // The editor state is per-user UI state, so VIEWER access is sufficient for both reading and writing.
    private void verifyAccess(String projectId, User user) {
        if (!projectRoleService.hasMinimumRole(projectId, user.getId(), ProjectRole.VIEWER)) {
            log.debug("Access denied: User '{}' has no role on project '{}'", user.getId(), projectId);
            throw new AccessDeniedException("project", projectId);
        }
    }
}
