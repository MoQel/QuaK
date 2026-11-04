package edu.kit.quak.application.filesystem.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
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

    @Mock
    private FileContentRepositoryPort contentRepository;

    @Mock
    private CircuitServicePort circuitService;

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
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class))).thenReturn(true);
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
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class))).thenReturn(true);
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
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class))).thenReturn(true);
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.removeDirectory(dirId, testUser);

        // Assert
        assertFalse(parent.getContents().contains(dir));
        verify(delegator).save(parent);
    }

    @Test
    void removeDirectory_deletesContentsAndCircuitsOfNestedFiles() {
        Project parent = new Project("Root", testUserId);
        Directory dir = new Directory("ToDel", parent.getId());
        Directory nested = new Directory("Nested", dir.getId());
        File file = new File("a.qasm", dir.getId());
        File nestedFile = new File("b.qasm", nested.getId());
        nested.addChild(nestedFile);
        dir.addChild(nested);
        dir.addChild(file);
        parent.addChild(dir);
        when(repository.findById(dir.getId())).thenReturn(Optional.of(dir));
        when(roleService.hasMinimumRole(eq(parent.getId()), eq(testUserId), any(ProjectRole.class))).thenReturn(true);
        when(delegator.findContainerById(parent.getId())).thenReturn(Optional.of(parent));

        service.removeDirectory(dir.getId(), testUser);

        verify(contentRepository).deleteContents(
            argThat(ids -> ids.size() == 2 && ids.containsAll(List.of(file.getId(), nestedFile.getId())))
        );
        verify(circuitService).deleteByFileId(file.getId());
        verify(circuitService).deleteByFileId(nestedFile.getId());
    }
}
