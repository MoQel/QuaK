package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.*;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileElementJpaMapperTest {

    private FileElementJpaMapper mapper;

    @Mock
    private FileJpaMapper fileMapper;
    @Mock
    private DirectoryJpaMapper directoryMapper;
    @Mock
    private ProjectJpaMapper projectMapper;

    @BeforeEach
    void setup() throws Exception {
        mapper = Mappers.getMapper(FileElementJpaMapper.class);

        // DI via Reflection
        // Mockito @InjectMocks does often not work directly with abstract MapStruct classes
        TestUtil.setField(mapper, "fileMapper", fileMapper);
        TestUtil.setField(mapper, "directoryMapper", directoryMapper);
        TestUtil.setField(mapper, "projectMapper", projectMapper);
    }

    @Test
    void mapFileToJpa() {
        // Arrange
        File file = new File("test.txt", null);
        JpaFile expectedJpa = new JpaFile("test.txt", null);
        expectedJpa.setName("test.txt");

        // Mock Behavior
        when(fileMapper.toJpaEntity(file)).thenReturn(expectedJpa);

        // Act
        JpaFileElement<?> result = mapper.toJpaEntity(file);

        // Assert
        assertEquals(expectedJpa, result);
        verify(fileMapper).toJpaEntity(file); // Ensure that right mapper found
        verifyNoInteractions(directoryMapper, projectMapper); // Ensure that no incorrect mappers were called
    }

    @Test
    void mapDirectoryToJpa() {
        // Arrange
        Directory dir = new Directory("Dir", null);
        JpaDirectory expectedJpa = new JpaDirectory("Dir", null);

        when(directoryMapper.toJpaEntity(dir)).thenReturn(expectedJpa);

        // Act
        JpaFileElement<?> result = mapper.toJpaEntity(dir);

        // Assert
        assertEquals(expectedJpa, result);
        verify(directoryMapper).toJpaEntity(dir);
    }

    @Test
    void mapProjectToJpa() {
        // Arrange
        Project p = new Project("X");
        JpaProject expectedJpa = new JpaProject("X");

        when(projectMapper.toJpaEntity(p)).thenReturn(expectedJpa);

        // Act
        JpaFileElement<?> result = mapper.toJpaEntity(p);

        // Assert
        assertEquals(expectedJpa, result);
        verify(projectMapper).toJpaEntity(p);
    }

    @Test
    void mapSetToJpaSet() {
        // Arrange
        Directory d = new Directory("D", null);
        File f = new File("F", null);
        Set<FileElement<?>> source = Set.of(d, f);

        when(directoryMapper.toJpaEntity(d)).thenReturn(new JpaDirectory("D", null));
        when(fileMapper.toJpaEntity(f)).thenReturn(new JpaFile("F", null));

        // Act
        Set<JpaFileElement<?>> mapped = mapper.toJpaSet(source);

        // Assert
        assertEquals(2, mapped.size());
        verify(directoryMapper).toJpaEntity(d);
        verify(fileMapper).toJpaEntity(f);
        verifyNoMoreInteractions(directoryMapper, fileMapper, projectMapper);
    }

    @Test
    void mapUnknownTypeThrows() {
        // Arrange
        FileElement<?> unknown = new FileElement<>("X", null) {
            @Override public String getTypeIdentifier() { return "x"; }
            @Override public char getIdPrefix() { return 'x'; }
        };

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> mapper.toJpaEntity(unknown));

        assertTrue(exception.getMessage().contains("Unknown FileElement subtype"));
    }
}
