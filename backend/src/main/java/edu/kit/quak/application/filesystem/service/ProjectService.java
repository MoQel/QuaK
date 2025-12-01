package edu.kit.quak.application.filesystem.service;

import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.application.filesystem.ports.incoming.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.outgoing.ProjectRepositoryPort;

import java.util.List;
import java.util.Optional;

public class ProjectService implements ProjectServicePort {

    private final ProjectRepositoryPort repository;

    public ProjectService(ProjectRepositoryPort repository) {
        this.repository = repository;
    }

    // TODO: parentId?
    @Override
    public Project createProject(Project container, String parentId) {
        return repository.save(container);
    }

    @Override
    public Optional<Project> renameProject(String pId, String newName ) {
        return Optional.empty();
    }

    @Override
    public void removeProject(String id) {
        repository.deleteById(id);
    }

    @Override
    public Optional<Project> retrieveProject(String id) {
        return repository.findById(id);
    }

    @Override
    public List<Project> listProjects() {
        return repository.getAllProjects();
    }

    @Override
    public List<FileElement<?>> listImmediateChildren(String containerId) {
        return repository.findImmediateChildren(containerId);
    }
}
