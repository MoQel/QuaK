package edu.kit.quak.application.editorstate.ports.in;

import edu.kit.quak.core.editorstate.model.EditorState;
import edu.kit.quak.core.user.model.User;
import java.util.Optional;

public interface EditorStateServicePort {
    /** Returns the user's editor state for the given project, if one was saved. */
    Optional<EditorState> getByProjectId(String projectId, User user);

    /** Creates or updates the user's editor state for the given project. */
    EditorState save(String projectId, String tabsJson, User user);
}
