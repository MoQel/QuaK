package edu.kit.quak.infrastructure.editorstate.out.db.jpa;

import edu.kit.quak.application.editorstate.ports.out.EditorStateRepositoryPort;
import edu.kit.quak.core.editorstate.model.EditorState;
import edu.kit.quak.infrastructure.editorstate.out.db.jpa.entity.JpaEditorState;
import edu.kit.quak.infrastructure.editorstate.out.db.jpa.repository.SpringDataJpaEditorStateRepository;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class EditorStateJpaAdapter implements EditorStateRepositoryPort {

    private final SpringDataJpaEditorStateRepository repository;

    public EditorStateJpaAdapter(SpringDataJpaEditorStateRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<EditorState> findByProjectIdAndUserId(String projectId, String userId) {
        return repository.findByProjectIdAndUserId(projectId, userId).map(this::toDomain);
    }

    @Override
    public EditorState save(EditorState editorState) {
        return toDomain(repository.saveAndFlush(toEntity(editorState)));
    }

    private EditorState toDomain(JpaEditorState entity) {
        return new EditorState(entity.getId(), entity.getProjectId(), entity.getUserId(), entity.getTabsJson());
    }

    private JpaEditorState toEntity(EditorState domain) {
        JpaEditorState entity = new JpaEditorState();
        entity.setId(domain.getId());
        entity.setProjectId(domain.getProjectId());
        entity.setUserId(domain.getUserId());
        entity.setTabsJson(domain.getTabsJson());
        return entity;
    }
}
