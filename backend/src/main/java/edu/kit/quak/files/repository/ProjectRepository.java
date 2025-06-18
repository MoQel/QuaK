package edu.kit.quak.files.repository;

import edu.kit.quak.files.model.Project;
import org.springframework.data.repository.CrudRepository;

public interface ProjectRepository extends CrudRepository<Project, String> {
}
