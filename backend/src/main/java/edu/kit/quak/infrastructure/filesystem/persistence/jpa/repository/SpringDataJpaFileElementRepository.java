package edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaFileElement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataJpaFileElementRepository extends JpaRepository<JpaFileElement<?>, String> {

    // Custom query based on the 'parent' field in JpaFileElement
    List<JpaFileElement<?>> findByParentId(String parentId);
}
