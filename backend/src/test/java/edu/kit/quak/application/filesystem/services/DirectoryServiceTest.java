package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
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
class DirectoryServiceTest {

    @Mock
    private DirectoryRepositoryPort repository;
    @Mock
    private FileElementContainerRepositoryDelegator delegator;

    @InjectMocks
    private DirectoryService service;

    @Test
    void createDirectory_savesParent() {
        // Arrange
        String parentId = "p-1";
        Project parent = new Project("RootProject");
        parent.setId(parentId);

        Directory newDir = new Directory("NewDir", parentId);
        newDir.setId("d-new");

        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenReturn(parent);

        // Act
        service.createDirectory(newDir, parentId);

        // Assert
        assertTrue(parent.getContents().contains(newDir));
        assertEquals(parentId, newDir.getParentId());
        verify(delegator).save(parent);
    }

    @Test
    void createDirectory_throws_whenParentNotFound() {
        Directory newDir = new Directory("NewDir", "missing");
        when(delegator.findContainerById("missing")).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> service.createDirectory(newDir, "missing"));
    }

    @Test
    void renameDirectory_renamesAndSavesParent() {
        // Arrange
        String dirId = "dir-1";
        String parentId = "p-1";

        Project parent = new Project("Root");
        parent.setId(parentId);

        Directory dir = new Directory("OldName", parentId);
        dir.setId(dirId);

        parent.addChild(dir);

        when(repository.findById(dirId)).thenReturn(Optional.of(dir));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        when(delegator.save(parent)).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        service.renameDirectory(dirId, "NewName");

        // Assert
        assertEquals("NewName", dir.getName());
        verify(delegator).save(parent);
    }

    @Test
    void removeDirectory_removesFromParentAndSaves() {
        // Arrange
        String dirId = "dir-1";
        String parentId = "p-1";

        Project parent = new Project("Root");
        parent.setId(parentId);

        Directory dir = new Directory("ToDel", parentId);
        dir.setId(dirId);

        parent.addChild(dir);

        when(repository.findById(dirId)).thenReturn(Optional.of(dir));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.removeDirectory(dirId);

        // Assert
        assertFalse(parent.getContents().contains(dir));
        verify(delegator).save(parent);
    }
}