package edu.kit.quak.application.filesystem.delegator;

import edu.kit.quak.application.filesystem.ports.out.FileElementContainerRepositoryPort;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileElementContainerRepositoryDelegatorTest {

    // --- 1. Define Dummy Entities with PUBLIC constructors ---
    // This bypasses the IllegalAccessException caused by protected constructors in real entities
    static class TestProject extends FileElementContainer<TestProject> {
        public TestProject() { super("TestProj", null); }

        @Override
        public String getTypeIdentifier() {
            return "";
        }

        @Override public char getIdPrefix() { return 'p'; }
    }

    static class TestDirectory extends FileElementContainer<TestDirectory> {
        public TestDirectory() { super("TestDir", null); }

        @Override
        public String getTypeIdentifier() {
            return "";
        }

        @Override public char getIdPrefix() { return 'd'; }
    }

    // --- 2. Define Dummy Interfaces binding the generic types ---
    interface ProjectRepo extends FileElementContainerRepositoryPort<TestProject> {}
    interface DirectoryRepo extends FileElementContainerRepositoryPort<TestDirectory> {}

    @Mock
    ProjectRepo projectRepo;

    @Mock
    DirectoryRepo directoryRepo;

    FileElementContainerRepositoryDelegator delegator;

    @BeforeEach
    void setup() {
        delegator = new FileElementContainerRepositoryDelegator(
                List.of(projectRepo, directoryRepo)
        );
    }

    @Test
    @DisplayName("save(Project) is delegated to ProjectRepository")
    void saveProject_routesCorrectly() {
        TestProject project = new TestProject();

        when(projectRepo.save(project)).thenReturn(project);

        // We cast to raw or wildcards because the delegator returns generic types
        FileElementContainer<?> result = delegator.save(project);

        assertSame(project, result);
        verify(projectRepo).save(project);
        verify(directoryRepo, never()).save(any());
    }

    @Test
    @DisplayName("save(Directory) is delegated to DirectoryRepository")
    void saveDirectory_routesCorrectly() {
        TestDirectory dir = new TestDirectory();

        when(directoryRepo.save(dir)).thenReturn(dir);

        FileElementContainer<?> result = delegator.save(dir);

        assertSame(dir, result);
        verify(directoryRepo).save(dir);
        verify(projectRepo, never()).save(any());
    }

    @Test
    @DisplayName("findContainerById routes by prefix 'p' to ProjectRepository")
    void findById_projectPrefix() {
        TestProject project = new TestProject();
        // Assume 'p' is the prefix for TestProject
        String id = "p-123";

        when(projectRepo.findById(id)).thenReturn(Optional.of(project));

        Optional<FileElementContainer<?>> result = delegator.findContainerById(id);

        assertTrue(result.isPresent());
        assertSame(project, result.get());
        verify(projectRepo).findById(id);
    }

    @Test
    @DisplayName("findContainerById routes by prefix 'd' to DirectoryRepository")
    void findById_directoryPrefix() {
        TestDirectory dir = new TestDirectory();
        String id = "d-456";

        when(directoryRepo.findById(id)).thenReturn(Optional.of(dir));

        Optional<FileElementContainer<?>> result = delegator.findContainerById(id);

        assertTrue(result.isPresent());
        assertSame(dir, result.get());
        verify(directoryRepo).findById(id);
    }

    @Test
    @DisplayName("findContainerById returns empty for unknown prefix")
    void findById_unknownPrefix_returnsEmpty() {
        Optional<FileElementContainer<?>> result = delegator.findContainerById("x-999");

        assertTrue(result.isEmpty());
        verifyNoInteractions(projectRepo, directoryRepo);
    }

    @Test
    @DisplayName("save throws when no repository is registered for type")
    void save_unknownType_throws() {
        // Local class satisfies generic bounds (T extends Container<T>)
        class UnknownContainer extends FileElementContainer<UnknownContainer> {
            public UnknownContainer() { super("X", null); }
            @Override public String getTypeIdentifier() { return "x"; }
            @Override public char getIdPrefix() { return 'x'; }
        }

        var unknown = new UnknownContainer();

        assertThrows(IllegalArgumentException.class, () -> delegator.save(unknown));
    }
}