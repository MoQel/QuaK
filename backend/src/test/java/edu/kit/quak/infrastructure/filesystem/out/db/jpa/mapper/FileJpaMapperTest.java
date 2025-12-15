package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FileJpaMapperTest {

    private FileJpaMapper mapper;

    @BeforeEach
    void setup() {
        mapper = Mappers.getMapper(FileJpaMapper.class);
    }

    @Test
    void domainToJpaFile() {
        File file = new File("hello.txt", null);

        JpaFile jpa = mapper.toJpaEntity(file);

        assertEquals("hello.txt", jpa.getName());
        assertEquals(file.getContentType(), jpa.getContentType());
    }

    @Test
    void jpaToDomainFile() {
        JpaFile jpa = new JpaFile("A.txt", null);
        jpa.setContentType("text/plain");

        File domain = mapper.toDomainEntity(jpa);

        assertEquals("A.txt", domain.getName());
        assertEquals("text/plain", domain.getContentType());
    }
}
