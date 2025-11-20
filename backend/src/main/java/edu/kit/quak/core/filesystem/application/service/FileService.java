package edu.kit.quak.core.filesystem.application.service;

import edu.kit.quak.core.filesystem.domain.File;
import edu.kit.quak.core.filesystem.ports.incoming.FileServicePort;

import edu.kit.quak.core.filesystem.ports.outgoing.FileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FileService implements FileServicePort {

    private final FileRepositoryPort repository;

    public FileService(FileRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public File create(File element, String parentId) {
        return repository.save(element);
    }

    @Override
    @Transactional
    public File update(File element) {
        return repository.save(element);
    }

    @Override
    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    public File get(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FileElement not found: " + id));
    }

    @Override
    public byte[] getContent(String fileId) {
        File file = get(fileId);
        return file.getContent(); // assuming FileElement has content getter
    }

    @Override
    @Transactional
    public void setContent(String fileId, byte[] content, String contentType) {
        File file = get(fileId);
        file.setContent(content);
        file.setContentType(contentType);
        repository.save(file);
    }
}
