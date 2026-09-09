package edu.kit.quak.infrastructure.editorstate.out.db.jpa.repository;

import edu.kit.quak.infrastructure.editorstate.out.db.jpa.entity.JpaEditorState;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataJpaEditorStateRepository extends JpaRepository<JpaEditorState, String> {
    Optional<JpaEditorState> findByProjectIdAndUserId(String projectId, String userId);
}
