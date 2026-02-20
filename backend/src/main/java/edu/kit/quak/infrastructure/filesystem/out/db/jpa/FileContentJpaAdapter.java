package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileContent;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataFileContentRepository;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataJpaFileRepository;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
public class FileContentJpaAdapter implements FileContentRepositoryPort {

    private final SpringDataFileContentRepository contentRepository;
    private final SpringDataJpaFileRepository fileRepository;

    public FileContentJpaAdapter(SpringDataFileContentRepository contentRepository, SpringDataJpaFileRepository fileRepository) {
        this.contentRepository = contentRepository;
        this.fileRepository = fileRepository;
    }

    @Override
    public void saveContent(String fileId, byte[] content) {
        if (!fileRepository.existsById(fileId)) {
            log.error("Data inconsistency: Cannot save content. File metadata missing. fileId={}", fileId);
            throw new IllegalStateException("File metadata missing for content save operation");
        }

        JpaFileContent entity = contentRepository
            .findById(fileId)
            .map(existing -> {
                // Update
                existing.setContent(content);
                return existing;
            })
            .orElseGet(() -> {
                // Create
                return new JpaFileContent(fileId, content);
            });

        // store
        contentRepository.save(entity);
    }

    @Override
    public Optional<byte[]> loadContent(String fileId) {
        return contentRepository.findById(fileId).map(JpaFileContent::getContent);
    }

    @Override
    public void deleteContent(String fileId) {
        contentRepository.deleteById(fileId);
    }
}
