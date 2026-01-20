package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@UnitTest
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
    void createFile_linksToParentAndSaves() {
        // Arrange
        String parentId = "p-1";
        Project parent = new Project("P");
        parent.setId(parentId);

        File file = new File("test.txt", parentId);
        file.setId("f-new");

        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenReturn(parent);

        // Act
        File result = service.createFile(file, parentId);

        // Assert
        assertTrue(parent.getContents().contains(result));
        assertEquals(parentId, result.getParentId());
        verify(delegator).save(parent);
    }

    @Test
    void setFileContent_updatesMetadataAndSavesContent() {
        // Arrange
        String fileId = "f-1";
        String parentId = "p-1";

        Project parent = new Project("P");
        parent.setId(parentId);

        File file = new File("test.txt", parentId);
        file.setId(fileId);

        parent.addChild(file);

        when(repository.findById(fileId)).thenReturn(Optional.of(file));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        service.setFileContent(fileId, "Hello".getBytes(), "text/plain");

        // Assert
        assertEquals("text/plain", file.getContentType());
        verify(contentRepository).saveContent(fileId, "Hello".getBytes());
        verify(delegator).save(parent);
    }

    @Test
    void removeFile_deletesMetadataAndContent() {
        // Arrange
        String fileId = "f-1";
        String parentId = "p-1";

        Project parent = new Project("P");
        parent.setId(parentId);

        File file = new File("del.txt", parentId);
        file.setId(fileId);

        parent.addChild(file);

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
    void renameFile_throws_whenCorruptState() {
        File orphanFile = new File("Orphan", null);
        orphanFile.setId("f-1");

        when(repository.findById("f-1")).thenReturn(Optional.of(orphanFile));

        assertThrows(IllegalStateException.class,
                () -> service.renameFile("f-1", "NewName"));
    }
}