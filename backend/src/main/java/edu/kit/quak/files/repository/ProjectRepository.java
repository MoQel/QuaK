package edu.kit.quak.files.repository;

import edu.kit.quak.core.filesystem.model.Project;
import org.springframework.data.repository.CrudRepository;

import edu.kit.quak.core.filesystem.model.User;
import java.util.List;

public interface ProjectRepository extends CrudRepository<Project, String> {
    List<Project> findAllByOwner(User owner);
}
