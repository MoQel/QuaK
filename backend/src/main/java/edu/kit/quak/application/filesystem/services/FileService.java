package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.user.model.User;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.function.Consumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class FileService implements FileServicePort {

    private final FileRepositoryPort repository;
    private final FileContentRepositoryPort contentRepository;
    private final FileElementContainerRepositoryDelegator delegator;

    public FileService(
            FileRepositoryPort repository,
            FileContentRepositoryPort contentRepository,
            FileElementContainerRepositoryDelegator delegator) {
        this.repository = repository;
        this.contentRepository = contentRepository;
        this.delegator = delegator;
    }

    // region Create
    @Override
    @Transactional
    public File createFile(File element, String parentId, User user) {
        log.info(
                "Creating file '{}' in parent '{}' for user '{}'",
                element.getName(),
                parentId,
                user.getId());
        verifyOwnershipByParentId(parentId, user);

        FileElementContainer<?> parent = getParentById(parentId);
        parent.addChild(element);
        FileElementContainer<?> savedParent = delegator.save(parent);
        return findFileInParent(savedParent, element.getId());
    }

    // endregion Create

    // region Read
    @Override
    public File retrieveFile(String id, User user) {
        log.debug("Retrieving file '{}' for user '{}'", id, user.getId());
        File file = repository.findById(id).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(file.getParentId(), user);
        return file;
    }

    @Override
    @Transactional
    public byte[] getFileContent(String fId, User user) {
        log.debug("Retrieving content for file '{}'", fId);
        File file =
                repository
                        .findById(fId)
                        .orElseThrow(() -> new NoSuchElementException("File not found: " + fId));
        verifyOwnershipByParentId(file.getParentId(), user);
        return contentRepository.loadContent(fId).orElseThrow(NoSuchElementException::new);
    }

    // endregion Retrieve

    // region Update
    @Override
    @Transactional
    public File renameFile(String fId, String newName, User user) {
        log.info("Renaming file '{}' to '{}' for user '{}'", fId, newName, user.getId());
        File file = repository.findById(fId).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(file.getParentId(), user);
        return modifyFileInParent(fId, f -> f.rename(newName));
    }

    @Override
    @Transactional
    public void setFileContent(String fId, byte[] content, String contentType, User user) {
        log.info("Updating content for file '{}'", fId);
        File file = repository.findById(fId).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(file.getParentId(), user);

        modifyFileInParent(
                fId,
                f -> {
                    f.setLastAccessNow();
                    f.setContentType(contentType);
                });
        // Store content blob seperate
        contentRepository.saveContent(fId, content);
    }

    // endregion Update

    // region Delete
    @Override
    @Transactional
    public void removeFile(String fId, User user) {
        log.info("Removing file '{}' for user '{}'", fId, user.getId());
        File file = retrieveFileWithoutAuth(fId);
        verifyOwnershipByParentId(file.getParentId(), user);

        FileElementContainer<?> parent = getParentById(file.getParentId());
        parent.removeChild(file);
        delegator.save(parent);
        contentRepository.deleteContent(fId);
    }

    // endregion Delete

    /** Retrieves file without authentication check (internal use only). */
    private File retrieveFileWithoutAuth(String id) {
        return repository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    /**
     * Verifies that the given user owns the project containing the file/directory. Uses a single
     * efficient database query with recursive CTE to find the root project's owner, avoiding N+1
     * queries when traversing deep hierarchies.
     *
     * @param parentId the ID of the parent container
     * @param user the user to verify ownership for
     * @throws AccessDeniedException if user doesn't own the project
     */
    private void verifyOwnershipByParentId(String parentId, User user) {
        if (parentId == null) {
            throw new IllegalStateException("Cannot verify ownership: element has no parent");
        }

        // Use efficient single-query ownership lookup
        UUID projectOwnerId =
                delegator
                        .findProjectOwnerIdByElementId(parentId)
                        .orElseThrow(
                                () ->
                                        new IllegalStateException(
                                                "Could not find root project for element with"
                                                        + " parent ID: "
                                                        + parentId));

        if (!projectOwnerId.equals(user.getId())) {
            log.warn(
                    "Access denied: User '{}' is not owner of project '{}' (file parent: '{}')",
                    user.getId(),
                    projectOwnerId,
                    parentId);
            throw new AccessDeniedException("file", parentId);
        }
    }

    // Get the fresh parent (important due to shallow copies of mappers)
    private FileElementContainer<?> getParentById(String parentId) {
        if (parentId == null) throw new IllegalStateException("File has no parent corrupt state");
        return delegator
                .findContainerById(parentId)
                .orElseThrow(
                        () -> new IllegalStateException("Parent not found with ID" + parentId));
    }

    private File findFileInParent(FileElementContainer<?> parent, String fileId) {
        return parent.getContents().stream()
                .filter(c -> c.getId().equals(fileId))
                .filter(c -> c instanceof File)
                .map(c -> (File) c)
                .findFirst()
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "File not found in parent container (ID: " + fileId + ")"));
    }

    private File modifyFileInParent(String fileId, Consumer<File> modifier) {
        File tempFile = retrieveFileWithoutAuth(fileId);
        FileElementContainer<?> parent = getParentById(tempFile.getParentId());

        // Finding the "real" child in the context of the parents
        File childInParent = findFileInParent(parent, fileId);

        // Apply changes
        modifier.accept(childInParent);

        // Save changes through parent
        FileElementContainer<?> savedParent = delegator.save(parent);

        // Return updated child
        return findFileInParent(savedParent, fileId);
    }
}
