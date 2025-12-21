package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import edu.kit.quak.test.helpers.AuthTestHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@UnitTest
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepositoryPort repository;

    @Mock
    private UserServicePort userService;

    private ProjectService service;
    private User testUser;
    private AuthenticatedUser authenticatedUser;

    @BeforeEach
    void setUp() {
        service = new ProjectService(repository, userService);
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        authenticatedUser = AuthTestHelper.createAuthenticatedUser(testUser.getId());
    }

    @Test
    void createProject_delegatesToRepo() {
        when(userService.getAuthenticatedUser(authenticatedUser)).thenReturn(testUser);
        when(repository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Project p = new Project("P1");
        Project result = service.createProject(p, authenticatedUser);

        assertEquals(testUser.getId(), result.getOwnerId());
        verify(repository).save(p);
    }

    @Test
    void renameProject_updatesNameAndSaves() {
        // Arrange
        Project p = new Project("Old", testUser.getId());
        when(userService.getAuthenticatedUser(authenticatedUser)).thenReturn(testUser);
        when(repository.findById("1")).thenReturn(Optional.of(p));
        when(repository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        service.renameProject("1", "New", authenticatedUser);

        // Assert
        assertEquals("New", p.getName());
        verify(repository).save(p);
    }

    @Test
    void renameProject_throws_whenNotFound() {
        when(userService.getAuthenticatedUser(authenticatedUser)).thenReturn(testUser);
        when(repository.findById(anyString())).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> service.renameProject("99", "New", authenticatedUser));
    }
}
