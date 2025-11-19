package edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataJpaProjectRepository extends JpaRepository<JpaProject, String> { }
