package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.user.model.User;
import java.util.NoSuchElementException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class DirectoryService extends AbstractFileElementService<Directory> implements DirectoryServicePort {

    private final DirectoryRepositoryPort repository;

    public DirectoryService(DirectoryRepositoryPort repository, FileElementContainerRepositoryDelegator delegator) {
        super(delegator);
        this.repository = repository;
    }

    // region Create
    @Override
    @Transactional
    public Directory createDirectory(Directory container, String parentId, User user) {
        log.info("Creating directory '{}' in parent '{}' for user '{}'", container.getName(), parentId, user.getId());
        verifyOwnershipByParentId(parentId, user);

        FileElementContainer<?> parent = getParentById(parentId);
        parent.addChild(container);
        FileElementContainer<?> savedParent = delegator.save(parent);
        return findElementInParent(savedParent, container.getId());
    }

    // endregion Create

    // region Read
    @Override
    public Directory retrieveDirectory(String id, User user) {
        log.debug("Retrieving directory '{}' for user '{}'", id, user.getId());
        Directory directory = repository.findById(id).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(directory.getParentId(), user);
        return directory;
    }

    // endregion Read

    // region Update
    @Override
    @Transactional
    public Directory renameDirectory(String dId, String newName, User user) {
        log.info("Renaming directory '{}' to '{}' for user '{}'", dId, newName, user.getId());
        Directory directory = repository.findById(dId).orElseThrow(NoSuchElementException::new);
        verifyOwnershipByParentId(directory.getParentId(), user);
        checkForDuplicateName(dId, newName);
        return modifyElementInParent(dId, d -> d.rename(newName));
    }

    // endregion Update

    // region Delete
    @Override
    @Transactional
    public void removeDirectory(String dId, User user) {
        log.info("Removing directory '{}' for user '{}'", dId, user.getId());
        Directory directory = retrieveWithoutAuth(dId);
        verifyOwnershipByParentId(directory.getParentId(), user);

        FileElementContainer<?> parent = getParentById(directory.getParentId());
        parent.removeChild(directory);
        delegator.save(parent);
    }

    // endregion Delete

    // region AbstractFileElementService Implementation

    @Override
    protected Directory retrieveWithoutAuth(String id) {
        return repository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Override
    protected String getElementTypeName() {
        return "directory";
    }

    @Override
    protected boolean isCorrectType(FileElement<?> element) {
        return element instanceof Directory;
    }

    @Override
    protected Directory castToType(FileElement<?> element) {
        return (Directory) element;
    }

    // endregion
}
