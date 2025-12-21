package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.*;

@UnitTest
@ExtendWith(MockitoExtension.class)
class ProjectJpaMapperTest {

    private ProjectJpaMapper mapper;
    private FileElementJpaMapper elementMapper;

    @BeforeEach
    void setUp() {
        mapper = Mappers.getMapper(ProjectJpaMapper.class);
        elementMapper = spy(Mappers.getMapper(FileElementJpaMapper.class));
        ReflectionTestUtils.setField(mapper, "fileElementJpaMapper", elementMapper);
    }

    @Test
    void domainToJpaEntity() {
        // Arrange
        Project p = new Project("P");
        new Directory("Dir", p.getId());
        new File("F", p.getId());

        JpaDirectory mockJpaDir = new JpaDirectory("Dir_JPA", null);
        JpaFile mockJpaFile = new JpaFile("F_JPA", null);
        Set<JpaFileElement<?>> mockJpaContents = Set.of(mockJpaDir, mockJpaFile);

        when(elementMapper.toJpaSet(anySet())).thenReturn(mockJpaContents);

        // Act
        JpaProject jpa = mapper.toJpaEntity(p);

        // Assert
        assertEquals("P", jpa.getName());
        assertNotNull(jpa.getContents());
        assertEquals(2, jpa.getContents().size());

        verify(elementMapper).toJpaSet(p.getContents());
    }

    @Test
    void jpaToDomainEntity() {
        // Arrange
        JpaProject jpa = new JpaProject("P");
        JpaDirectory d = new JpaDirectory("Dir", jpa);
        JpaFile f = new JpaFile("F", d);

        Set<JpaFileElement<?>> jpaContents = Set.of(d, f);
        jpa.setContents(jpaContents);

        Directory mockDomainDir = new Directory("Dir_Domain", "p-mock");
        File mockDomainFile = new File("F_Domain", "d-mock");
        Set<FileElement<?>> mockDomainContents = Set.of(mockDomainDir, mockDomainFile);

        when(elementMapper.toDomainSet(anySet())).thenReturn(mockDomainContents);

        // Act
        Project domain = mapper.toDomainEntity(jpa);

        // Assert
        assertEquals("P", domain.getName());
        assertNotNull(domain.getContents());
        assertEquals(2, domain.getContents().size());

        verify(elementMapper).toDomainSet(jpa.getContents());
    }
}