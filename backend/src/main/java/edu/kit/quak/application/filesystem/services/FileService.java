package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.function.Consumer;

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
        FileElementContainer<?> parent = getParentById(parentId);
        parent.addChild(element);
        FileElementContainer<?> savedParent = delegator.save(parent);
        // Create initially empty content entry
        File createdFile = findFileInParent(savedParent, element.getId());
        contentRepository.saveContent(createdFile.getId(), new byte[0]);
        return createdFile;
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
        if (!repository.existsById(fId)) {
            throw new NoSuchElementException("File not found: " + fId);
        }
        return contentRepository.loadContent(fId).orElseThrow(NoSuchElementException::new);
    }
    // endregion Retrieve

    // region Update
    @Override
    @Transactional
    public File renameFile(String fId, String newName) {
        return modifyFileInParent(fId, file -> file.rename(newName));
    }

    @Override
    @Transactional
    public void setFileContent(String fId, byte[] content, String contentType) {
        modifyFileInParent(fId, file -> {
            file.setLastAccessNow();
            file.setContentType(contentType);
        });
        // Store content blob seperate
        contentRepository.saveContent(fId, content);
    }
    // endregion Update

    // region Delete
    @Override
    @Transactional
    public void removeFile(String fId) {
        File file = retrieveFile(fId);
        FileElementContainer<?> parent = getParentById(file.getParentId());
        parent.removeChild(file);
        delegator.save(parent);
        contentRepository.deleteContent(fId);
    }
    // endregion Delete

    // Get the fresh parent (important due to shallow copies of mappers)
    private FileElementContainer<?> getParentById(String parentId) {
        if (parentId == null) throw new IllegalStateException("File has no parent corrupt state");
        return delegator.findContainerById(parentId)
                .orElseThrow(() -> new IllegalStateException("Parent not found with ID" + parentId));
    }

    private File findFileInParent(FileElementContainer<?> parent, String fileId) {
        return parent.getContents().stream()
                .filter(c -> c.getId().equals(fileId))
                .filter(c -> c instanceof File)
                .map(c -> (File) c)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("File not found in parent container (ID: " + fileId + ")"));
    }

    private File modifyFileInParent(String fileId, Consumer<File> modifier) {
        File tempFile = retrieveFile(fileId);
        FileElementContainer<?> parent = getParentById(tempFile.getParentId());

        // Finding the “real” child in the context of the parents
        File childInParent = findFileInParent(parent, fileId);

        // Apply changes
        modifier.accept(childInParent);

        // Save changes through parent
        FileElementContainer<?> savedParent = delegator.save(parent);

        // Return updated child
        return findFileInParent(savedParent, fileId);
    }
}
