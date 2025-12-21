package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElement;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.*;

@UnitTest
@ExtendWith(MockitoExtension.class)
class DirectoryJpaMapperTest {

    private DirectoryJpaMapper mapper;
    private FileElementJpaMapper elementMapper;

    @BeforeEach
    void setUp() {
        mapper = Mappers.getMapper(DirectoryJpaMapper.class);
        elementMapper = spy(Mappers.getMapper(FileElementJpaMapper.class));
        ReflectionTestUtils.setField(mapper, "fileElementJpaMapper", elementMapper);
    }

    @Test
    void domainToJpaEntity_ShouldIgnoreParent_AndMapContents() {
        // Arrange
        String parentId = "p-root";
        Directory dir = new Directory("D", parentId);
        File child = new File("Child", dir.getId());
        dir.addChild(child);

        JpaFileElement<?> mockJpaFile = new JpaFile("Child_JPA", null);
        when(elementMapper.toJpaSet(anySet())).thenReturn(Set.of(mockJpaFile));

        // Act
        JpaDirectory jpa = mapper.toJpaEntity(dir);

        // Assert
        assertEquals("D", jpa.getName());
        assertNull(jpa.getParent());

        assertNotNull(jpa.getContents());
        assertEquals(1, jpa.getContents().size());
        verify(elementMapper).toJpaSet(dir.getContents());
    }

    @Test
    void jpaToDomainEntity_ShouldMapParentId() {
        // Arrange
        JpaProject parentProject = new JpaProject("RootProject");
        parentProject.setId("p-root-1");

        JpaDirectory jpa = new JpaDirectory("Dir", null);
        jpa.setParent(parentProject); // Set Parent

        JpaFile f = new JpaFile("F", jpa);
        jpa.setContents(Set.of(f));

        FileElement<?> mockDomainFile = new File("F_DOMAIN", "d-ignore");
        when(elementMapper.toDomainSet(anySet())).thenReturn(Set.of(mockDomainFile));

        // Act
        Directory dir = mapper.toDomainEntity(jpa);

        // Assert
        assertEquals("Dir", dir.getName());
        assertEquals("p-root-1", dir.getParentId());

        assertNotNull(dir.getContents());
        assertEquals(1, dir.getContents().size());
        verify(elementMapper).toDomainSet(jpa.getContents());
    }
}