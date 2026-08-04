package edu.kit.quak.application.editorstate.ports.out;

import edu.kit.quak.core.editorstate.model.EditorState;
import java.util.Optional;

public interface EditorStateRepositoryPort {
    Optional<EditorState> findByProjectIdAndUserId(String projectId, String userId);

    EditorState save(EditorState editorState);
}
