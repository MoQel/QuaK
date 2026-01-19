package edu.kit.quak.application.filesystem.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class DirectoryServiceTest {

    @Mock private DirectoryRepositoryPort repository;
    @Mock private FileElementContainerRepositoryDelegator delegator;

    @InjectMocks private DirectoryService service;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setIssuer("github");
        testUser.setSub("testuser");
    }

    @Test
    void createDirectory_savesParent() {
        // Arrange
        String parentId = "p-1";
        Project parent = new Project("RootProject", testUserId);
        parent.setId(parentId);

        Directory newDir = new Directory("NewDir", parentId);
        newDir.setId("d-new");

        // Mock the efficient ownership check
        when(delegator.findProjectOwnerIdByElementId(parentId)).thenReturn(Optional.of(testUserId));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenReturn(parent);

        // Act
        service.createDirectory(newDir, parentId, testUser);

        // Assert
        assertTrue(parent.getContents().contains(newDir));
        assertEquals(parentId, newDir.getParentId());
        verify(delegator).save(parent);
    }

    @Test
    void createDirectory_throws_whenParentNotFound() {
        Directory newDir = new Directory("NewDir", "missing");

        // Mock the ownership check to succeed, but container lookup fails
        when(delegator.findProjectOwnerIdByElementId("missing")).thenReturn(Optional.empty());

        assertThrows(
                IllegalStateException.class,
                () -> service.createDirectory(newDir, "missing", testUser));
    }

    @Test
    void renameDirectory_renamesAndSavesParent() {
        // Arrange
        String dirId = "dir-1";
        String parentId = "p-1";

        Project parent = new Project("Root", testUserId);
        parent.setId(parentId);

        Directory dir = new Directory("OldName", parentId);
        dir.setId(dirId);

        parent.addChild(dir);

        when(repository.findById(dirId)).thenReturn(Optional.of(dir));
        // Mock the efficient ownership check
        when(delegator.findProjectOwnerIdByElementId(parentId)).thenReturn(Optional.of(testUserId));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        when(delegator.save(parent)).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        service.renameDirectory(dirId, "NewName", testUser);

        // Assert
        assertEquals("NewName", dir.getName());
        verify(delegator).save(parent);
    }

    @Test
    void removeDirectory_removesFromParentAndSaves() {
        // Arrange
        String dirId = "dir-1";
        String parentId = "p-1";

        Project parent = new Project("Root", testUserId);
        parent.setId(parentId);

        Directory dir = new Directory("ToDel", parentId);
        dir.setId(dirId);

        parent.addChild(dir);

        when(repository.findById(dirId)).thenReturn(Optional.of(dir));
        // Mock the efficient ownership check
        when(delegator.findProjectOwnerIdByElementId(parentId)).thenReturn(Optional.of(testUserId));
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.removeDirectory(dirId, testUser);

        // Assert
        assertFalse(parent.getContents().contains(dir));
        verify(delegator).save(parent);
    }
}
