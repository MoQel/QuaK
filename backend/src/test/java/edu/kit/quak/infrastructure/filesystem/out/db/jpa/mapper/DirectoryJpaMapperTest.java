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

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DirectoryJpaMapperTest {

    private DirectoryJpaMapper mapper;

    @Mock
    private FileElementJpaMapper elementMapper;

    @BeforeEach
    void setup() throws Exception {
        mapper = Mappers.getMapper(DirectoryJpaMapper.class);
        TestUtil.setField(mapper, "fileElementJpaMapper", elementMapper);
    }

    @Test
    void domainToJpaDirectory() {
        // Arrange
        Directory dir = new Directory("D", null);
        new File("F", dir);

        JpaFileElement<?> mockJpaFile = new JpaFile("F_JPA", null);

        when(elementMapper.toJpaSet(anySet())).thenReturn(Set.of(mockJpaFile));

        // Act
        JpaDirectory jpa = mapper.toJpaEntity(dir);

        // Assert
        assertEquals("D", jpa.getName());
        assertNotNull(jpa.getContents());
        assertEquals(1, jpa.getContents().size());

        verify(elementMapper).toJpaSet(dir.getContents());
    }

    @Test
    void jpaToDomainDirectory() {
        // Arrange
        JpaDirectory jpa = new JpaDirectory("Dir", null);
        JpaFile f = new JpaFile("F", jpa);
        jpa.setContents(Set.of(f));

        FileElement<?> mockDomainFile = new File("F_DOMAIN", null);

        when(elementMapper.toDomainSet(anySet())).thenReturn(Set.of(mockDomainFile));

        // Act
        Directory dir = mapper.toDomainEntity(jpa);

        // Assert
        assertEquals("Dir", dir.getName());
        assertNotNull(dir.getContents());
        assertEquals(1, dir.getContents().size());

        verify(elementMapper).toDomainSet(jpa.getContents());
    }
}
