package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.DirectoryJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileJpaMapperImpl;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.ProjectJpaMapperImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({
        FileContentJpaAdapter.class,
        ProjectJpaAdapter.class,
        DirectoryJpaAdapter.class,
        ProjectJpaMapperImpl.class,
        DirectoryJpaMapperImpl.class,
        FileJpaMapperImpl.class,
        FileElementJpaMapperImpl.class
})
class FileContentJpaAdapterTest {

    @Autowired
    private FileContentJpaAdapter contentAdapter;

    @Autowired
    private ProjectJpaAdapter projectAdapter;
    @Autowired
    private DirectoryJpaAdapter directoryAdapter;

    private String validFileId;

    @BeforeEach
    void setupMetadata() {
        Project p = projectAdapter.save(new Project("ContentProject"));
        Directory d = directoryAdapter.save(new Directory("ContentDir", p));
        new File("Data.bin", d);

        Directory savedDir = directoryAdapter.save(d);

        this.validFileId = savedDir.getContents().iterator().next().getId();
    }

    @Test
    void saveAndLoadContent_success() {
        byte[] data = "Hello World".getBytes();

        // Act
        contentAdapter.saveContent(validFileId, data);
        Optional<byte[]> loaded = contentAdapter.loadContent(validFileId);

        // Assert
        assertTrue(loaded.isPresent());
        assertArrayEquals(data, loaded.get());
    }

    @Test
    void saveContent_throws_whenMetadataMissing() {
        assertThrows(IllegalArgumentException.class, () ->
                contentAdapter.saveContent("invalid-id", new byte[]{1, 2, 3})
        );
    }

    @Test
    void updateContent_overwritesExistingData() {
        byte[] dataV1 = "Version 1".getBytes();
        contentAdapter.saveContent(validFileId, dataV1);

        byte[] dataV2 = "Version 2 (Updated)".getBytes();
        contentAdapter.saveContent(validFileId, dataV2);

        Optional<byte[]> result = contentAdapter.loadContent(validFileId);
        assertTrue(result.isPresent());
        assertArrayEquals(dataV2, result.get());
    }

    @Test
    void deleteContent_removesData() {
        // Arrange
        contentAdapter.saveContent(validFileId, "To Delete".getBytes());
        assertTrue(contentAdapter.loadContent(validFileId).isPresent());

        // Act
        contentAdapter.deleteContent(validFileId);

        // Assert
        assertTrue(contentAdapter.loadContent(validFileId).isEmpty());
    }

    @Test
    void loadContent_returnsEmpty_whenNoContentExists() {
        Optional<byte[]> result = contentAdapter.loadContent(validFileId);

        assertTrue(result.isEmpty());
    }
}
