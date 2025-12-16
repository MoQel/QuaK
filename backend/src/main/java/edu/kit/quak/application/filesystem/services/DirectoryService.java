package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;
import java.util.function.Consumer;

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
        parent.addChild(container);
        FileElementContainer<?> savedParent = delegator.save(parent);
        return findDirectoryInParent(savedParent, container.getId());
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
        return modifyDirectoryInParent(dId, directory -> directory.rename(newName));
    }
    // endregion Update

    // region Delete
    @Override
    @Transactional
    public void removeDirectory(String dId) {
        Directory directory = retrieveDirectory(dId);
        FileElementContainer<?> parent = getParentById(directory.getParentId());
        parent.removeChild(directory);
        delegator.save(parent);
    }
    // endregion Delete

    // Get the fresh parent (important due to shallow copies of mappers)
    private FileElementContainer<?> getParentById(String parentId) {
        if (parentId == null) throw new IllegalStateException("Directory has no parent corrupt state");
        return delegator.findContainerById(parentId)
                .orElseThrow(() -> new IllegalStateException("Parent not found with ID" + parentId));
    }

    private Directory findDirectoryInParent(FileElementContainer<?> parent, String dId) {
        return parent.getContents().stream()
                .filter(c -> c.getId().equals(dId))
                .filter(c -> c instanceof Directory)
                .map(c -> (Directory) c)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("File not found in parent container (ID: " + dId + ")"));
    }

    private Directory modifyDirectoryInParent(String dId, Consumer<Directory> modifier) {
        Directory tempDir = retrieveDirectory(dId);
        FileElementContainer<?> parent = getParentById(tempDir.getParentId());

        // Finding the “real” child in the context of the parents
        Directory childInParent = findDirectoryInParent(parent, dId);

        // Apply changes
        modifier.accept(childInParent);

        // Save changes through parent
        FileElementContainer<?> savedParent = delegator.save(parent);

        // Return updated child
        return findDirectoryInParent(savedParent, dId);
    }
}
