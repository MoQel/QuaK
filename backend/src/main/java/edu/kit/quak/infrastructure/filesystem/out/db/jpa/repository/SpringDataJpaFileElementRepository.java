package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// TODO: Für jede Entity ein eigenes Repo
public interface SpringDataJpaFileElementRepository extends JpaRepository<JpaFileElement<?>, String> {

    // Custom query based on the 'parent' field in JpaFileElement
    List<JpaFileElement<?>> findByParentId(String parentId);
    List<Project> findAllProjects();
}
