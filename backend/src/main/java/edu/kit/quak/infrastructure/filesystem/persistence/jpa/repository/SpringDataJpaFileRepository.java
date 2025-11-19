package edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataJpaFileRepository extends JpaRepository<JpaFile, String> { }