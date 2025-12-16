package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElement;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
        TestUtil.setField(mapper, "fileMapper", fileMapper);
        TestUtil.setField(mapper, "directoryMapper", directoryMapper);
        TestUtil.setField(mapper, "projectMapper", projectMapper);
    }

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

        when(directoryMapper.toJpaEntity(dir)).thenReturn(expectedJpa);

        // Act
        JpaFileElement<?> result = mapper.toJpaEntity(dir);

        // Assert
        assertEquals(expectedJpa, result);
        verify(directoryMapper).toJpaEntity(dir);
    }


    @Test
    void mapUnknownTypeThrows() {
        // Arrange
        FileElement<?> unknown = new FileElement("X", null) {
            @Override public String getTypeIdentifier() { return "x"; }
            @Override public char getIdPrefix() { return 'x'; } // <-- Neu
        };

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> mapper.toJpaEntity(unknown));

        assertTrue(exception.getMessage().contains("Unknown FileElement subtype"));
    }
}