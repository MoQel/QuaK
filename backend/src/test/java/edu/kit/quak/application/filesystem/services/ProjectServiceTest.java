package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@UnitTest
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepositoryPort repository;

    @InjectMocks
    private ProjectService service;

    @Test
    void createProject_delegatesToRepo() {
        Project p = new Project("P1");
        service.createProject(p);
        verify(repository).save(p);
    }

    @Test
    void renameProject_updatesNameAndSaves() {
        // Arrange
        Project p = new Project("Old");
        when(repository.findById("1")).thenReturn(Optional.of(p));

        // Act
        service.renameProject("1", "New");

        // Assert
        assertEquals("New", p.getName());
        verify(repository).save(p);
    }

    @Test
    void renameProject_throws_whenNotFound() {
        when(repository.findById(anyString())).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> service.renameProject("99", "New"));
    }
}
