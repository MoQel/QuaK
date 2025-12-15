package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileContent;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataFileContentRepository;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataJpaFileRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class FileContentJpaAdapter implements FileContentRepositoryPort {

    private final SpringDataFileContentRepository contentRepository;
    private final SpringDataJpaFileRepository fileRepository;
    private final FileElementJpaMapper elementMapper;

    public FileContentJpaAdapter(SpringDataFileContentRepository contentRepository,
                                 SpringDataJpaFileRepository fileRepository, FileElementJpaMapper elementMapper) {
        this.contentRepository = contentRepository;
        this.fileRepository = fileRepository;
        this.elementMapper = elementMapper;
    }

    @Override
    public void saveContent(String fileId, byte[] content) {
        String dbId = elementMapper.removePrefix(fileId);
        if (!fileRepository.existsById(dbId)) {
            throw new IllegalArgumentException("Cannot save content. File Metadata not found for ID: " + fileId);
        }

        JpaFileContent entity = contentRepository.findById(dbId)
                .map(existing -> {
                    // Update
                    existing.setContent(content);
                    return existing;
                })
                .orElseGet(() -> {
                    // Create
                    return new JpaFileContent(dbId, content);
                });

        // store
        contentRepository.save(entity);
    }

    @Override
    public Optional<byte[]> loadContent(String fileId) {
        String dbId = elementMapper.removePrefix(fileId);
        return contentRepository.findById(dbId)
                .map(JpaFileContent::getContent);
    }

    @Override
    public void deleteContent(String fileId) {
        String dbId = elementMapper.removePrefix(fileId);
        contentRepository.deleteById(dbId);
    }
}