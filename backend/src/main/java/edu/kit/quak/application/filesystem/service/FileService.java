package edu.kit.quak.application.filesystem.service;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.application.filesystem.ports.incoming.FileServicePort;
import edu.kit.quak.application.filesystem.ports.outgoing.FileElementContainerRepositoryPort;
import edu.kit.quak.application.filesystem.ports.outgoing.FileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileNotFoundException;
import java.util.Optional;

@Service
public class FileService implements FileServicePort {

    private final FileRepositoryPort repository;
    private final FileElementContainerRepositoryPort parentRepository;

    public FileService(FileRepositoryPort repository, FileElementContainerRepositoryPort parentRepository) {
        this.repository = repository;
        this.parentRepository = parentRepository;
    }

    @Override
    @Transactional
    public File createFile(File element, String parentId) {
        FileElementContainer<?> parent = parentRepository.findContainerById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent not found"));
        return repository.save(element, parent);
    }

    @Override
    @Transactional
    public Optional<File> renameFile(String fId, String newName) {
        return repository.rename(fId, newName);
    }

    @Override
    @Transactional
    public void removeFile(String id) {
        repository.deleteById(id);
    }

    @Override
    public Optional<File> retrieveFile(String id) {
        return repository.findById(id);
    }

    @Override
    @Transactional
    public void setFileContent(String fileId, byte[] content, String contentType) throws FileNotFoundException {
        File file = retrieveFile(fileId)
                .orElseThrow(() -> new FileNotFoundException("File not found with ID: " + fileId));
        file.setContent(content);
        file.setContentType(contentType);
//        repository.save(file);
    }

    @Override
    public Optional<byte[]> getFileContent(String fileId) {
        return retrieveFile(fileId)
                .map(File::getContent);
    }
}
