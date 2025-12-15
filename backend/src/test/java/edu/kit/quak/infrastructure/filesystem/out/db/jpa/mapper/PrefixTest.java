package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PrefixTest {
    private ProjectJpaMapper projectMapper;
    private DirectoryJpaMapper directoryMapper;
    private FileJpaMapper fileMapper;

    @BeforeEach
    void setup() {
        FileElementJpaMapper elementMapper = Mappers.getMapper(FileElementJpaMapper.class);
        projectMapper = Mappers.getMapper(ProjectJpaMapper.class);
        directoryMapper = Mappers.getMapper(DirectoryJpaMapper.class);
        fileMapper = Mappers.getMapper(FileJpaMapper.class);

        ReflectionTestUtils.setField(projectMapper, "fileElementJpaMapper", elementMapper);
        ReflectionTestUtils.setField(directoryMapper, "fileElementJpaMapper", elementMapper);
        ReflectionTestUtils.setField(fileMapper, "fileElementJpaMapper", elementMapper);
    }

    @Test
    void toJpaEntity_removesPrefix() {
        // Arrange
        Project domainP = new Project("MyProject");
        domainP.setId("p-11111111-1111-1111-1111-111111111111");

        Directory domainD = new Directory("MyDir", null);
        domainD.setId("d-22222222-2222-2222-2222-222222222222");

        File domainF = new File("MyFile.txt", null);
        domainF.setId("f-33333333-3333-3333-3333-333333333333");

        // Act
        JpaProject jpaP = projectMapper.toJpaEntity(domainP);
        JpaDirectory jpaD = directoryMapper.toJpaEntity(domainD);
        JpaFile jpaF = fileMapper.toJpaEntity(domainF);

        // Assert
        assertEquals("11111111-1111-1111-1111-111111111111", jpaP.getId());
        assertEquals("22222222-2222-2222-2222-222222222222", jpaD.getId());
        assertEquals("33333333-3333-3333-3333-333333333333", jpaF.getId());
    }

    @Test
    void toDomainEntity_addsPrefix() {
        // Arrange
        JpaProject jpaP = new JpaProject("MyProject");
        jpaP.setId("11111111-1111-1111-1111-111111111111");

        JpaDirectory jpaD = new JpaDirectory("MyDir", null);
        jpaD.setId("22222222-2222-2222-2222-222222222222");

        JpaFile jpaF = new JpaFile("MyFile.txt", null);
        jpaF.setId("33333333-3333-3333-3333-333333333333");

        // Act
        Project domainP = projectMapper.toDomainEntity(jpaP);
        Directory domainD = directoryMapper.toDomainEntity(jpaD);
        File domainF = fileMapper.toDomainEntity(jpaF);

        // Assert
        assertEquals("p-11111111-1111-1111-1111-111111111111", domainP.getId());
        assertEquals("d-22222222-2222-2222-2222-222222222222", domainD.getId());
        assertEquals("f-33333333-3333-3333-3333-333333333333", domainF.getId());
    }
}