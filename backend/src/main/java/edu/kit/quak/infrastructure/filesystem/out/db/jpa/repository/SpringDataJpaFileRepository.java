package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataJpaFileRepository extends JpaRepository<JpaFile, String> {
}
