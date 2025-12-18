package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElement;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@UnitTest
@ExtendWith(MockitoExtension.class)
class FileElementJpaMapperTest {

    @InjectMocks
    private FileElementJpaMapperImpl mapper;

    @Spy
    private FileJpaMapperImpl fileMapper;
    @Spy
    private DirectoryJpaMapperImpl directoryMapper;
    @Spy
    private ProjectJpaMapperImpl projectMapper;

    @Test
    void mapFileToJpa() {
        // Arrange - Update: Parent ID string
        File file = new File("test.txt", "d-parent");
        JpaFile expectedJpa = new JpaFile("test.txt", null);
        expectedJpa.setName("test.txt");

        when(fileMapper.toJpaEntity(file)).thenReturn(expectedJpa);

        // Act
        JpaFileElement<?> result = mapper.toJpaEntity(file);

        // Assert
        assertEquals(expectedJpa, result);
        verify(fileMapper).toJpaEntity(file);
    }

    @Test
    void mapDirectoryToJpa() {
        // Arrange - Update: Parent ID string
        Directory dir = new Directory("Dir", "p-root");
        JpaDirectory expectedJpa = new JpaDirectory("Dir", null);

        doReturn(expectedJpa).when(directoryMapper).toJpaEntity(dir);

        // Act
        JpaFileElement<?> result = mapper.toJpaEntity(dir);

        // Assert
        assertEquals(expectedJpa, result);
        verify(directoryMapper).toJpaEntity(dir);
    }


    @Test
    void mapUnknownTypeThrows() {
        // Arrange
        // Use a local class to satisfy the recursive generic type T extends FileElement<T>
        class UnknownFileElement extends FileElement<UnknownFileElement> {
            public UnknownFileElement(String name, String parentId) {
                super(name, parentId);
            }
            @Override public String getTypeIdentifier() { return "x"; }
            @Override public char getIdPrefix() { return 'x'; }
        }

        UnknownFileElement unknown = new UnknownFileElement("X", null);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> mapper.toJpaEntity(unknown));

        assertTrue(exception.getMessage().contains("Unknown FileElement subtype"));
    }
}