package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataProjectRepository extends JpaRepository<JpaProject, String> {
}
