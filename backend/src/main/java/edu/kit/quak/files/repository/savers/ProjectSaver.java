package edu.kit.quak.files.repository.savers;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.files.repository.ProjectRepository;
import edu.kit.quak.files.repository.RepoMonad;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Handles saving of {@link Project projects}.
 *
 * @author Henrik K
 */
@Component
public class ProjectSaver implements FileElementSaver<Project> {

    private final ProjectRepository repository;

    @Autowired
    public ProjectSaver(ProjectRepository repository) {
        this.repository = repository;
    }

    @Override
    public String getTypeIdentifier() {
        return Project.TYPE_IDENTIFIER;
    }

    @Override
    public Optional<RepoMonad<?>> getRepoMonad() {
        return Optional.of(new RepoMonad<>(repository));
    }

    @Override
    public Project saveNew(Project project) {
        project.setId(null);
        if (!project.getElements().isEmpty()) {
            throw new IllegalArgumentException("New Projects cannot already contain files");
        }
        return repository.save(project);
    }

    @Override
    public Class<Project> getRelatedClass() {
        return Project.class;
    }

    @Override
    public CrudRepository<Project, String> getRepository() {
        return repository;
    }

    @Override
    public boolean hasElement(String id) {
        return repository.findById(id).isPresent();
    }
}
