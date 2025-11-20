package edu.kit.quak.core.filesystem.application.service;

import edu.kit.quak.core.filesystem.domain.FileElementContainer;
import edu.kit.quak.core.filesystem.domain.Project;
import edu.kit.quak.core.filesystem.ports.incoming.FileElementContainerServicePort;

import java.util.List;
import java.util.Optional;

public class FileElementContainerService implements FileElementContainerServicePort {
    @Override
    public List<Project> listProjects() {
        return List.of();
    }

    @Override
    public FileElementContainer<?> create(FileElementContainer<?> container, String parentId) {
        return null;
    }

    @Override
    public FileElementContainer<?> update(FileElementContainer<?> container) {
        return null;
    }

    @Override
    public void delete(String id) {

    }

    @Override
    public Optional<FileElementContainer<?>> get(String id) {
        return Optional.empty();
    }

    @Override
    public List<?> listImmediateChildren(String containerId) {
        return List.of();
    }
}
