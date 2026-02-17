package edu.kit.quak.application.filesystem.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.ProjectRole;
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

    @Mock
    private DirectoryRepositoryPort repository;

    @Mock
    private FileElementContainerRepositoryDelegator delegator;

    @Mock
    private ProjectRoleServicePort roleService;

    @InjectMocks
    private DirectoryService service;

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

        // Mock the role-based access check
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class)))
                .thenReturn(true);
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

        // Parent ID "missing" starts with 'm' (not 'p'), so resolveProjectId will
        // call findProjectIdByElementId which returns empty → throws
        // IllegalStateException
        when(delegator.findProjectIdByElementId("missing")).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> service.createDirectory(newDir, "missing", testUser));
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
        // Mock the role-based access check
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class)))
                .thenReturn(true);
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
        // Mock the role-based access check
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class)))
                .thenReturn(true);
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.removeDirectory(dirId, testUser);

        // Assert
        assertFalse(parent.getContents().contains(dir));
        verify(delegator).save(parent);
    }
}
