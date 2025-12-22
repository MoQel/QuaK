package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;
import java.util.function.Consumer;

@Service
public class DirectoryService implements DirectoryServicePort {

    private final DirectoryRepositoryPort repository;
    private final FileElementContainerRepositoryDelegator delegator;

    public DirectoryService(DirectoryRepositoryPort repository,
            FileElementContainerRepositoryDelegator delegator) {
        this.repository = repository;
        this.delegator = delegator;
    }

    // region Create
    @Override
    @Transactional
    public Directory createDirectory(Directory container, String parentId, User user) {
        verifyOwnershipByParentId(parentId, user);

        FileElementContainer<?> parent = getParentById(parentId);
        parent.addChild(container);
        FileElementContainer<?> savedParent = delegator.save(parent);
        return findDirectoryInParent(savedParent, container.getId());
    }
    // endregion Create

    // region Read
    @Override
    public Directory retrieveDirectory(String id, User user) {
        Directory directory = repository.findById(id).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(directory.getParentId(), user);
        return directory;
    }
    // endregion Read

    // region Update
    @Override
    @Transactional
    public Directory renameDirectory(String dId, String newName, User user) {
        Directory directory = repository.findById(dId).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(directory.getParentId(), user);
        return modifyDirectoryInParent(dId, d -> d.rename(newName));
    }
    // endregion Update

    // region Delete
    @Override
    @Transactional
    public void removeDirectory(String dId, User user) {
        Directory directory = retrieveDirectoryWithoutAuth(dId);
        verifyOwnershipByParentId(directory.getParentId(), user);

        FileElementContainer<?> parent = getParentById(directory.getParentId());
        parent.removeChild(directory);
        delegator.save(parent);
    }
    // endregion Delete

    /**
     * Retrieves directory without authentication check (internal use only).
     */
    private Directory retrieveDirectoryWithoutAuth(String id) {
        return repository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    /**
     * Verifies that the given user owns the project containing the file/directory
     * by traversing up the parent chain until reaching the root project.
     * 
     * @param parentId the ID of the parent container
     * @param user     the user to verify ownership for
     * @throws AccessDeniedException if user doesn't own the project
     */
    private void verifyOwnershipByParentId(String parentId, User user) {
        if (parentId == null) {
            throw new IllegalStateException("Cannot verify ownership: element has no parent");
        }

        // Traverse up the parent chain to find the root project
        String currentParentId = parentId;
        while (currentParentId != null) {
            final String idForError = currentParentId;
            FileElementContainer<?> container = delegator.findContainerById(currentParentId)
                    .orElseThrow(() -> new IllegalStateException("Parent not found with ID: " + idForError));

            if (container instanceof Project project) {
                // Found the root project, verify ownership
                if (project.getOwnerId() == null || !project.getOwnerId().equals(user.getId())) {
                    throw new AccessDeniedException("directory", parentId);
                }
                return; // Ownership verified
            }

            // Move up to the parent
            currentParentId = container.getParentId();
        }

        throw new IllegalStateException("Could not find root project for element with parent ID: " + parentId);
    }

    // Get the fresh parent (important due to shallow copies of mappers)
    private FileElementContainer<?> getParentById(String parentId) {
        if (parentId == null)
            throw new IllegalStateException("Directory has no parent corrupt state");
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
        Directory tempDir = retrieveDirectoryWithoutAuth(dId);
        FileElementContainer<?> parent = getParentById(tempDir.getParentId());

        // Finding the "real" child in the context of the parents
        Directory childInParent = findDirectoryInParent(parent, dId);

        // Apply changes
        modifier.accept(childInParent);

        // Save changes through parent
        FileElementContainer<?> savedParent = delegator.save(parent);

        // Return updated child
        return findDirectoryInParent(savedParent, dId);
    }
}
