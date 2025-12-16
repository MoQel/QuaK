package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElementContainer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataFileElementContainerRepository extends JpaRepository<JpaFileElementContainer<?>, String> {
}
