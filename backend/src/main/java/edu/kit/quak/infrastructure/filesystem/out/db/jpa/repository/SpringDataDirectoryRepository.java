package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataDirectoryRepository extends JpaRepository<JpaDirectory, String> {
}
