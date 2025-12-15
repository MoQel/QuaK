package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileElementDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

// Minimal Spring setup to inject dependencies into the abstract mapper

@SpringBootTest(classes = FileElementDtoMapperTest.MapperTestConfig.class)
class FileElementDtoMapperTest {

    @Autowired
    FileElementDtoMapper mapper;

    @Test
    @DisplayName("Should map File entity to FileDetailsResponse")
    void testMapFile() {
        File file = new File("test.txt", null);

        FileElementDto result = mapper.toDto(file);

        assertThat(result.getType()).isEqualTo("file");
        assertThat(result.getName()).isEqualTo("test.txt");
    }

    @Test
    @DisplayName("Should map Directory entity to DirectoryDetailsResponse")
    void testMapDirectory() {
        Directory dir = new Directory("docs", null);

        FileElementDto result = mapper.toDto(dir);

        assertThat(result.getType()).isEqualTo("directory");
        assertThat(result.getName()).isEqualTo("docs");
    }

    // Configuration to pick up the MapStruct generated implementations
    @Configuration
    @ComponentScan(basePackageClasses = FileElementDtoMapper.class)
    static class MapperTestConfig {}
}
