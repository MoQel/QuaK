package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataFileContentRepository extends JpaRepository<JpaFileContent, String> {}
