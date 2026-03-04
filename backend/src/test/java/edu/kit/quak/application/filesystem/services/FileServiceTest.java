package edu.kit.quak.application.filesystem.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.filesystem.model.File;
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
class FileServiceTest {

    @Mock
    private FileRepositoryPort repository;

    @Mock
    private FileContentRepositoryPort contentRepository;

    @Mock
    private FileElementContainerRepositoryDelegator delegator;

    @Mock
    private ProjectRoleServicePort roleService;

    @InjectMocks
    private FileService service;

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
    void createFile_linksToParentAndSaves() {
        // Arrange
        String parentId = "p-1";
        Project parent = new Project("P", testUserId);
        parent.setId(parentId);

        File file = new File("test.txt", parentId);
        file.setId("f-new");

        // Mock the role-based access check
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class))).thenReturn(true);
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenReturn(parent);

        // Act
        File result = service.createFile(file, parentId, testUser);

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

        Project parent = new Project("P", testUserId);
        parent.setId(parentId);

        File file = new File("test.txt", parentId);
        file.setId(fileId);

        parent.addChild(file);

        when(repository.findById(fileId)).thenReturn(Optional.of(file));
        // Mock the role-based access check
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class))).thenReturn(true);
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));
        when(delegator.save(parent)).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        service.setFileContent(fileId, "Hello".getBytes(), "text/plain", testUser);

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

        Project parent = new Project("P", testUserId);
        parent.setId(parentId);

        File file = new File("del.txt", parentId);
        file.setId(fileId);

        parent.addChild(file);

        when(repository.findById(fileId)).thenReturn(Optional.of(file));
        // Mock the role-based access check
        when(roleService.hasMinimumRole(eq(parentId), eq(testUserId), any(ProjectRole.class))).thenReturn(true);
        when(delegator.findContainerById(parentId)).thenReturn(Optional.of(parent));

        // Act
        service.removeFile(fileId, testUser);

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

        assertThrows(IllegalStateException.class, () -> service.renameFile("f-1", "NewName", testUser));
    }
}
