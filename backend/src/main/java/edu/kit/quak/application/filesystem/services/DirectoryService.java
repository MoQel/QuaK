package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DirectoryService implements DirectoryServicePort {

    private final DirectoryRepositoryPort repository;
    public DirectoryService(DirectoryRepositoryPort repository) { this.repository = repository; }

    @Override
    public Directory createDirectory(Directory container, String parentId) {
        return repository.save(container);
    }

    @Override
    public Optional<Directory> renameDirectory(String dId, String newName) {
        return Optional.empty();
    }

    @Override
    public void removeDirectory(String id) { repository.deleteById(id); }

    @Override
    public Optional<Directory> retrieveDirectory(String id) {
        return repository.findById(id);
    }

    @Override
    public List<FileElement<?>> listImmediateChildren(String containerId) {
        return repository.findImmediateChildren(containerId);
    }
}
