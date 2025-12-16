package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
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
class DirectoryServiceTest {

    @Mock
    private DirectoryRepositoryPort repository;
    @Mock
    private FileElementContainerRepositoryDelegator delegator;

    @InjectMocks
    private DirectoryService service;

    @Test
    @Tag("unit")
    void createDirectory_savesParent() {
        // Arrange
        String parentId = "parent-123";
        Project parent = new Project("RootProject");
        parent.setId(parentId);
        Directory newDir = new Directory("NewDir", null);

        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenReturn(parent);

        // Act
        service.createDirectory(newDir, parentId);

        // Assert
        assertTrue(newDir.getParent().isPresent());
        assertEquals(parent, newDir.getParent().get()); // Parent link set
        verify(delegator).save(parent); // Verify save was called on Aggregate Root
    }

    @Test
    @Tag("unit")
    void createDirectory_throws_whenParentNotFound() {
        Directory newDir = new Directory("NewDir", null);
        when(delegator.findContainerById("missing")).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> service.createDirectory(newDir, "missing"));
    }

    @Test
    @Tag("unit")
    void renameDirectory_renamesAndSavesParent() {
        // Arrange
        String dirId = "dir-1";
        String parentId = "p-1";

        Project parent = new Project("Root");
        parent.setId(parentId);

        Directory dir = new Directory("OldName", parent);
        dir.setId(dirId);

        when(repository.findById(dirId)).thenReturn(Optional.of(dir));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.renameDirectory(dirId, "NewName");

        // Assert
        assertEquals("NewName", dir.getName());
        verify(delegator).save(parent);
    }

    @Test
    @Tag("unit")
    void removeDirectory_removesFromParentAndSaves() {
        // Arrange
        String dirId = "dir-1";
        String parentId = "p-1";

        Project parent = new Project("Root");
        parent.setId(parentId);

        Directory dir = new Directory("ToDel", parent);
        dir.setId(dirId);

        when(repository.findById(dirId)).thenReturn(Optional.of(dir));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.removeDirectory(dirId);

        // Assert
        assertFalse(parent.getContents().contains(dir));
        verify(delegator).save(parent);
    }
}
