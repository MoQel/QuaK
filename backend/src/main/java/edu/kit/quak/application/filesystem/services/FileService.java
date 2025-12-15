package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
public class FileService implements FileServicePort {

    private final FileRepositoryPort repository;
    private final FileContentRepositoryPort contentRepository;
    private final FileElementContainerRepositoryDelegator delegator;

    public FileService(FileRepositoryPort repository, FileContentRepositoryPort contentRepository, FileElementContainerRepositoryDelegator delegator) {
        this.repository = repository;
        this.contentRepository = contentRepository;
        this.delegator = delegator;
    }

    // region Create
    @Override
    @Transactional
    public File createFile(File element, String parentId) {
        FileElementContainer<?> parent = delegator.findContainerById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent not found with ID" + parentId));

        element.addToParent(parent);

        FileElementContainer<?> savedParent = delegator.save(parent);

        return savedParent.getContents().stream()
                .filter(child -> child instanceof File)
                .map(child -> (File) child)
                .filter(f -> f.getName().equals(element.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Saved child File not found - unexpected behavior DB/Mapping inconsisty?"));
    }
    // endregion Create

    // region Read
    @Override
    public File retrieveFile(String id) {
        return repository.findById(id).orElseThrow(NoSuchElementException::new);
    }

    @Override
    @Transactional
    public byte[] getFileContent(String fId) {
        return contentRepository.loadContent(fId).orElseThrow(NoSuchElementException::new);
    }
    // endregion Retrieve

    // region Update
    @Override
    @Transactional
    public File renameFile(String fId, String newName) {
        File file = repository.findById(fId)
                .orElseThrow(() -> new IllegalArgumentException("File not found with ID" + fId));

        FileElementContainer<?> parent = file.getParent()
                .orElseThrow(() -> new IllegalStateException("File has no parent — corrupt state"));

        parent.renameChild(file, newName);
        delegator.save(parent);
        return file;
    }

    @Override
    @Transactional
    public void setFileContent(String fileId, byte[] content, String contentType) {
        File file = retrieveFile(fileId);

        FileElementContainer<?> parent = file.getParent()
                .orElseThrow(() -> new IllegalStateException("File has no parent — corrupt state"));

        file.setLastAccessNow();
        file.setContentType(contentType);  // domain state

        contentRepository.saveContent(file.getId(), content);
        delegator.save(parent);
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
        contentRepository.deleteContent(fId);
    }
    // endregion Delete
}
