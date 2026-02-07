package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.user.model.User;
import java.util.NoSuchElementException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class FileService extends AbstractFileElementService<File> implements FileServicePort {

    private final FileRepositoryPort repository;
    private final FileContentRepositoryPort contentRepository;

    public FileService(
            FileRepositoryPort repository,
            FileContentRepositoryPort contentRepository,
            FileElementContainerRepositoryDelegator delegator) {
        super(delegator);
        this.repository = repository;
        this.contentRepository = contentRepository;
    }

    // region Create
    @Override
    @Transactional
    public File createFile(File element, String parentId, User user) {
        log.info("Creating file '{}' in parent '{}' for user '{}'", element.getName(), parentId, user.getId());
        verifyOwnershipByParentId(parentId, user);

        FileElementContainer<?> parent = getParentById(parentId);
        parent.addChild(element);
        FileElementContainer<?> savedParent = delegator.save(parent);
        // Create initially empty content entry
        File createdFile = findElementInParent(savedParent, element.getId());
        contentRepository.saveContent(createdFile.getId(), new byte[0]);
        return createdFile;
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
        File file = repository.findById(fId).orElseThrow(() -> new NoSuchElementException("File not found: " + fId));
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
        return modifyElementInParent(fId, f -> f.rename(newName));
    }

    @Override
    @Transactional
    public void setFileContent(String fId, byte[] content, String contentType, User user) {
        log.info("Updating content for file '{}'", fId);
        File file = repository.findById(fId).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(file.getParentId(), user);

        modifyElementInParent(fId, f -> {
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
        File file = retrieveWithoutAuth(fId);
        verifyOwnershipByParentId(file.getParentId(), user);

        FileElementContainer<?> parent = getParentById(file.getParentId());
        parent.removeChild(file);
        delegator.save(parent);
        contentRepository.deleteContent(fId);
    }

    // endregion Delete

    // region AbstractFileElementService Implementation

    @Override
    protected File retrieveWithoutAuth(String id) {
        return repository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Override
    protected String getElementTypeName() {
        return "file";
    }

    @Override
    protected boolean isCorrectType(FileElement<?> element) {
        return element instanceof File;
    }

    @Override
    protected File castToType(FileElement<?> element) {
        return (File) element;
    }

    // endregion
}
