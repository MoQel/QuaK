package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class DirectoryService implements DirectoryServicePort {

    private final DirectoryRepositoryPort repository;
    private final FileElementContainerRepositoryDelegator delegator;
    public DirectoryService(DirectoryRepositoryPort repository, FileElementContainerRepositoryDelegator delegator) {
        this.repository = repository;
        this.delegator = delegator;
    }

    // region Create

    @Override
    @Transactional
    public Directory createDirectory(Directory container, String parentId) {
        FileElementContainer<?> parent = getParentById(parentId);

        // Creates bidirectional relationshipt
        container.addToParent(parent);
        // Orchestrate container through aggregate root
        FileElementContainer<?> savedParent = delegator.save(parent);

        return savedParent.getContents().stream()
                .filter(child -> child instanceof Directory)
                .map(child -> (Directory) child)
                .filter(f -> f.getName().equals(container.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Saved child Directory not found - unexpected behavior DB/Mapping inconsisty?"));
    }

    // endregion Create

    // region Read

    @Override
    public Directory retrieveDirectory(String id) {
        return repository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    // endregion Read

    // region Update

    @Override
    @Transactional
    public Directory renameDirectory(String dId, String newName) {
        Directory directory = retrieveDirectory(dId);
        FileElementContainer<?> parent = getParentById(directory.getParentId());

        parent.renameChild(directory, newName);
        delegator.save(parent);
        return directory;
    }

    // endregion Update

    // region Delete

    @Override
    @Transactional
    public void removeDirectory(String dId) {
        Directory directory = retrieveDirectory(dId);
        FileElementContainer<?> parent = getParentById(directory.getParentId());

        parent.removeElement(directory);
        delegator.save(parent);
    }

    // endregion Delete

    // Get the fresh parent (important due to shallow copies of mappers)
    private FileElementContainer<?> getParentById(String parentId) {
        if (parentId == null) throw new IllegalStateException("Directory has no parent corrupt state");
        return delegator.findContainerById(parentId)
                .orElseThrow(() -> new IllegalStateException("Parent not found with ID" + parentId));
    }
}
