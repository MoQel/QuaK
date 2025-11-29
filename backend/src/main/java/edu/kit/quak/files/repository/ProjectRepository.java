package edu.kit.quak.files.repository;

import edu.kit.quak.files.model.Project;
import org.springframework.data.repository.CrudRepository;

import edu.kit.quak.security.model.User;
import java.util.List;

public interface ProjectRepository extends CrudRepository<Project, String> {
    List<Project> findAllByOwner(User owner);
}
