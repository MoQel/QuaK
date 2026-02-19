package edu.kit.quak.application.filesystem.delegator;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.filesystem.ports.out.FileElementContainerRepositoryPort;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class FileElementContainerRepositoryDelegatorTest {

    @Mock
    FileElementContainerRepositoryRegistry registry;

    @Mock
    FileElementContainerRepositoryPort<Project> projectRepo;

    FileElementContainerRepositoryDelegator delegator;

    @BeforeEach
    void setup() {
        delegator = new FileElementContainerRepositoryDelegator(registry);
    }

    @Test
    @DisplayName("save() uses prefix from container to resolve repository")
    void save_routesByPrefix() {
        Project project = new Project("Test"); // Prefix 'p'

        doReturn(Optional.of(projectRepo)).when(registry).getRepository('p');
        when(projectRepo.save(project)).thenReturn(project);

        Project result = delegator.save(project);

        assertSame(project, result);
        verify(registry).getRepository('p');
        verify(projectRepo).save(project);
    }

    @Test
    @DisplayName("findContainerById() extracts first char as prefix for lookup")
    void findById_extractsFirstChar() {
        String id = "p-unique-id";
        Project project = new Project("Test");

        // Use doReturn to handle generics safely without raw casts
        doReturn(Optional.of(projectRepo)).when(registry).getRepository('p');
        when(projectRepo.findById(id)).thenReturn(Optional.of(project));

        Optional<FileElementContainer<?>> result = delegator.findContainerById(id);

        assertTrue(result.isPresent());
        assertSame(project, result.get());
        verify(registry).getRepository('p');
        verify(projectRepo).findById(id);
    }

    @Test
    @DisplayName("save() throws IllegalArgumentException if no repo is registered")
    void save_throwsWhenNoRepoFound() {
        Project project = new Project("Test");
        when(registry.getRepository('p')).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> delegator.save(project));
    }

    @Test
    @DisplayName("findContainerById() returns empty Optional if prefix is unknown")
    void findById_returnsEmptyOnUnknownPrefix() {
        String id = "x-unknown";
        when(registry.getRepository('x')).thenReturn(Optional.empty());

        Optional<FileElementContainer<?>> result = delegator.findContainerById(id);

        assertTrue(result.isEmpty());
    }
}
