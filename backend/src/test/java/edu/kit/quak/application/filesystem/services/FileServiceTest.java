package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private FileRepositoryPort repository;
    @Mock
    private FileContentRepositoryPort contentRepository;
    @Mock
    private FileElementContainerRepositoryDelegator delegator;

    @InjectMocks
    private FileService service;

    @Test
    @Tag("unit")
    void createFile_linksToParentAndSaves() {
        // Arrange
        Project parent = new Project("P");
        File file = new File("test.txt", null);

        when(delegator.findContainerById("p-1")).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenReturn(parent);

        // Act
        service.createFile(file, "p-1");

        // Assert
        assertTrue(file.getParent().isPresent());
        assertEquals(parent, file.getParent().get());
        verify(delegator).save(parent);
    }

    @Test
    @Tag("unit")
    void setFileContent_updatesMetadataAndSavesContent() {
        // Arrange
        String fileId = "f-1";
        String parentId = "p-1";

        Project parent = new Project("P");
        parent.setId(parentId);

        File file = new File("test.txt", parent);
        file.setId(fileId);

        when(repository.findById(fileId)).thenReturn(Optional.of(file));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.setFileContent(fileId, "Hello".getBytes(), "text/plain");

        // Assert
        assertEquals("text/plain", file.getContentType());
        verify(contentRepository).saveContent(fileId, "Hello".getBytes());
        verify(delegator).save(parent);
    }

    @Test
    @Tag("unit")
    void removeFile_deletesMetadataAndContent() {
        // Arrange
        String fileId = "f-1";
        String parentId = "p-1";

        Project parent = new Project("P");
        parent.setId(parentId);

        File file = new File("del.txt", parent);
        file.setId(fileId);

        when(repository.findById(fileId)).thenReturn(Optional.of(file));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.removeFile(fileId);

        // Assert
        assertFalse(parent.getContents().contains(file));
        verify(delegator).save(parent);
        verify(contentRepository).deleteContent(fileId);
    }

    @Test
    @Tag("unit")
    void renameFile_throws_whenCorruptState() {
        // Scenario: File found in DB but has no parent (Data inconsistency)
        File orphanFile = new File("Orphan", null); // No parent!
        when(repository.findById("f-1")).thenReturn(Optional.of(orphanFile));

        assertThrows(IllegalStateException.class,
                () -> service.renameFile("f-1", "NewName"));
    }
}
