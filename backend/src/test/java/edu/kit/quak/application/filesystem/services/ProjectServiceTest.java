package edu.kit.quak.application.filesystem.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.common.ports.out.DomainEventPublisherPort;
import edu.kit.quak.application.filesystem.exception.ProjectNotFoundException;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.filesystem.event.ProjectDeletedEvent;
import edu.kit.quak.core.filesystem.exception.DuplicateNameException;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepositoryPort repository;

    @Mock
    private FileContentRepositoryPort fileContentRepository;

    @Mock
    private ProjectRoleServicePort roleService;

    @Mock
    private DomainEventPublisherPort eventPublisher;

    private ProjectService service;
    private User testUser;

    @BeforeEach
    void setUp() {
        service = new ProjectService(repository, fileContentRepository, roleService, eventPublisher);
        testUser = new User();
        testUser.setId(UUID.randomUUID());
    }

    @Test
    void createProject_savesProjectWithInitialFileAndMakesCreatorOwner() {
        when(repository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project result = service.createProject(new Project("P1"), testUser);

        assertEquals("P1", result.getName());
        assertEquals(testUser.getId(), result.getOwnerId());
        File initialFile = result.allFiles().getFirst();
        assertEquals(Project.INITIAL_FILE_NAME, initialFile.getName());
        verify(fileContentRepository).saveContent(eq(initialFile.getId()), any());
        verify(roleService).assignOwner(result.getId(), testUser.getId());
    }

    @Test
    void createProject_rejectsNameTheCreatorAlreadyUses() {
        when(repository.getProjectsByOwnerId(testUser.getId())).thenReturn(List.of(new Project("Demo", testUser.getId())));
        Project project = new Project("demo");

        assertThrows(DuplicateNameException.class, () -> service.createProject(project, testUser));

        verify(repository, never()).save(any());
    }

    @Test
    void listProjects_combinesOwnedAndSharedProjects() {
        Project owned = new Project("Own", testUser.getId());
        Project shared = new Project("Shared", UUID.randomUUID());
        when(repository.getProjectsByOwnerId(testUser.getId())).thenReturn(List.of(owned));
        when(roleService.findProjectIdsByUserIdAndRole(testUser.getId(), ProjectRole.VIEWER)).thenReturn(List.of(shared.getId()));
        when(repository.findAllByIds(List.of(shared.getId()))).thenReturn(List.of(shared));

        assertEquals(List.of(owned, shared), service.listProjects(testUser));
    }

    @Test
    void renameProject_updatesNameAndSaves() {
        // Arrange
        Project p = new Project("Old", testUser.getId());
        when(repository.findById("1")).thenReturn(Optional.of(p));
        when(repository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roleService.hasMinimumRole(any(), any(), any())).thenReturn(true);

        // Act
        service.renameProject("1", "New", testUser);

        // Assert
        assertEquals("New", p.getName());
        verify(repository).save(p);
    }

    @Test
    void renameProject_throws_whenNotFound() {
        when(repository.findById(anyString())).thenReturn(Optional.empty());

        assertThrows(ProjectNotFoundException.class, () -> service.renameProject("99", "New", testUser));
    }

    @Test
    void deleteAllByOwnerId_deletesEachProjectAndPublishesEvents() {
        Project first = new Project("P1", testUser.getId());
        Project second = new Project("P2", testUser.getId());
        when(repository.getProjectsByOwnerId(testUser.getId())).thenReturn(List.of(first, second));

        service.deleteAllByOwnerId(testUser.getId());

        for (Project project : List.of(first, second)) {
            verify(repository).deleteById(project.getId());
            verify(eventPublisher).publish(new ProjectDeletedEvent(project.getId()));
        }
        verifyNoInteractions(roleService);
    }

    @Test
    void removeProject_deletesContentsOfAllFilesAndPublishesEvent() {
        Project project = new Project("P1", testUser.getId());
        File topLevel = new File("top.qasm", project.getId());
        Directory dir = new Directory("Dir", project.getId());
        File nested = new File("nested.qasm", dir.getId());
        dir.addChild(nested);
        project.addChild(dir);
        project.addChild(topLevel);
        when(repository.findById(project.getId())).thenReturn(Optional.of(project));
        when(roleService.hasMinimumRole(any(), any(), any())).thenReturn(true);

        service.removeProject(project.getId(), testUser);

        verify(fileContentRepository).deleteContents(
            argThat(ids -> ids.size() == 2 && ids.containsAll(List.of(topLevel.getId(), nested.getId())))
        );
        verify(repository).deleteById(project.getId());
        verify(eventPublisher).publish(new ProjectDeletedEvent(project.getId()));
    }

    @Test
    void transferAllByOwnerId_movesProjectsAndNumbersTakenNames() {
        UUID guestId = UUID.randomUUID();
        Project demo = new Project("Demo", guestId);
        Project other = new Project("Other", guestId);
        when(repository.getProjectsByOwnerId(testUser.getId())).thenReturn(
            List.of(new Project("demo", testUser.getId()), new Project("Demo (2)", testUser.getId()))
        );
        when(repository.getProjectsByOwnerId(guestId)).thenReturn(List.of(demo, other));

        service.transferAllByOwnerId(guestId, testUser.getId());

        assertEquals("Demo (3)", demo.getName());
        assertEquals("Other", other.getName());
        assertEquals(testUser.getId(), demo.getOwnerId());
        assertEquals(testUser.getId(), other.getOwnerId());
        verify(repository).save(demo);
        verify(repository).save(other);
    }
}
