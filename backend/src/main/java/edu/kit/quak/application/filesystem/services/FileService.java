package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class FileService implements FileServicePort {

    private final FileRepositoryPort repository;
    private final FileElementContainerRepositoryDelegator delegator;

    public FileService(FileRepositoryPort repository, FileElementContainerRepositoryDelegator delegator) {
        this.repository = repository;
        this.delegator = delegator;
    }

    // region Create
    @Override
    @Transactional
    public File createFile(File element, String parentId) {
        FileElementContainer<?> parent = delegator.findContainerById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent not found with ID" + parentId));
        element.setParent(parent);
        return repository.save(element);
    }
    // endregion Create

    // region Read
    @Override
    public Optional<File> retrieveFile(String id) {
        return repository.findById(id);
    }

    @Override
    public Optional<byte[]> getFileContent(String fileId) {
        return retrieveFile(fileId)
                .map(File::getContent);
    }
    // endregion Retrieve

    // region Update
    @Override
    @Transactional
    public Optional<File> renameFile(String fId, String newName) {
        return repository.rename(fId, newName);
    }

    @Override
    @Transactional
    public void setFileContent(String fileId, byte[] content, String contentType) {
        File file = retrieveFile(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found with ID: " + fileId));
        file.setContent(content);
        file.setContentType(contentType);
        file.setLastAccessNow();
        repository.save(file);
    }
    // endregion Update

    // region Delete
    @Override
    @Transactional
    public void removeFile(String fId) {
        File file = repository.findById(fId)
                .orElseThrow(() -> new IllegalArgumentException("File not found with ID: " + fId));
        FileElementContainer<?> parent = file.getParent()
                        .orElseThrow(() -> new IllegalArgumentException("File has no parent corrupt state"));
        parent.removeElement(file);
        delegator.save(parent);
    }
    // endregion Delete
}
