package edu.kit.quak.application.filesystem.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.NoSuchElementException;
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

    @Mock private ProjectRepositoryPort repository;

    private ProjectService service;
    private User testUser;

    @BeforeEach
    void setUp() {
        service = new ProjectService(repository);
        testUser = new User();
        testUser.setId(UUID.randomUUID());
    }

    @Test
    void createProject_delegatesToRepo() {
        when(repository.save(any(Project.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Project p = new Project("P1");
        Project result = service.createProject(p, testUser);

        assertEquals(testUser.getId(), result.getOwnerId());
        verify(repository).save(p);
    }

    @Test
    void renameProject_updatesNameAndSaves() {
        // Arrange
        Project p = new Project("Old", testUser.getId());
        when(repository.findById("1")).thenReturn(Optional.of(p));
        when(repository.save(any(Project.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        service.renameProject("1", "New", testUser);

        // Assert
        assertEquals("New", p.getName());
        verify(repository).save(p);
    }

    @Test
    void renameProject_throws_whenNotFound() {
        when(repository.findById(anyString())).thenReturn(Optional.empty());

        assertThrows(
                NoSuchElementException.class, () -> service.renameProject("99", "New", testUser));
    }
}
