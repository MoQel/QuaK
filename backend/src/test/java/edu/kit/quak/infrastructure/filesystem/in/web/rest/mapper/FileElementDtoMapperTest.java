package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileElementDto;
import edu.kit.quak.shared.tags.UnitTest;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class FileElementDtoMapperTest {

    @Mock
    private FileDtoMapper fileMapper;

    @Mock
    private DirectoryDtoMapper directoryMapper;

    @InjectMocks
    private FileElementDtoMapper mapper;

    @Test
    @DisplayName("Should map File entity to FileDetailsResponse")
    void testMapFile() {
        File file = new File("test.txt", null);
        FileDetailsResponse expectedResponse = new FileDetailsResponse(
            file.getId(),
            "test.txt",
            "file",
            null,
            Instant.now(),
            Instant.now()
        );

        when(fileMapper.toDetailsResponse(any(File.class))).thenReturn(expectedResponse);

        FileElementDto result = mapper.toDto(file);

        assertThat(result).isNotNull();
        assertThat(result.getType()).isEqualTo("file");
        assertThat(result.getName()).isEqualTo("test.txt");
    }

    @Test
    @DisplayName("Should map Directory entity to DirectoryDetailsResponse")
    void testMapDirectory() {
        Directory dir = new Directory("docs", null);
        DirectoryDetailsResponse expectedResponse = new DirectoryDetailsResponse(
            dir.getId(),
            "docs",
            "directory",
            Instant.now(),
            Instant.now()
        );

        when(directoryMapper.toDetailsResponse(any(Directory.class))).thenReturn(expectedResponse);

        FileElementDto result = mapper.toDto(dir);

        assertThat(result).isNotNull();
        assertThat(result.getType()).isEqualTo("directory");
        assertThat(result.getName()).isEqualTo("docs");
    }
}
