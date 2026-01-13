package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileElementDto;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;

@UnitTest
@ExtendWith(MockitoExtension.class)
class FileElementDtoMapperTest {

    @Spy
    FileDtoMapperImpl fileMapper;

    @Spy
    DirectoryDtoMapperImpl directoryMapper;

    @InjectMocks
    FileElementDtoMapperImpl mapper;

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
}
