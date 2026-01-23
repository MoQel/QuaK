package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class FileJpaMapperTest {

    private FileJpaMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = Mappers.getMapper(FileJpaMapper.class);
    }

    @Test
    void domainToJpaEntity_ShouldIgnoreParent() {
        // Arrange
        String parentId = "d-123";
        File file = new File("hello.txt", parentId);

        // Act
        JpaFile jpa = mapper.toJpaEntity(file);

        // Assert
        assertEquals("hello.txt", jpa.getName());
        assertNull(jpa.getParent());
        assertEquals(file.getId(), jpa.getId());
    }

    @Test
    void jpaToDomainEntity_ShouldMapParentId() {
        // Arrange
        JpaDirectory parent = new JpaDirectory("dir", null);
        parent.setId("d-parent-1");

        JpaFile jpa = new JpaFile("A.txt", null); // Constructor might set parent to null initially
        jpa.setParent(parent); // Set parent relationship
        jpa.setContentType("text/plain");
        jpa.setId("f-file-1");

        // Act
        File domain = mapper.toDomainEntity(jpa);

        // Assert
        assertEquals("A.txt", domain.getName());
        assertEquals("text/plain", domain.getContentType());
        assertEquals("d-parent-1", domain.getParentId());
    }
}
