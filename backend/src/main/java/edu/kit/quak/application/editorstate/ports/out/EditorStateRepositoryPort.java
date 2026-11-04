package edu.kit.quak.application.editorstate.ports.out;

import edu.kit.quak.core.editorstate.model.EditorState;
import java.util.List;
import java.util.Optional;

public interface EditorStateRepositoryPort {
    Optional<EditorState> findByProjectIdAndUserId(String projectId, String userId);

    EditorState save(EditorState editorState);

    List<EditorState> findAllByUserId(String userId);

    void deleteById(String id);

    void deleteAllByUserId(String userId);

    void deleteAllByProjectId(String projectId);
}
