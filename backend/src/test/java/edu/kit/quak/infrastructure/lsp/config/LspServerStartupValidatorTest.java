package edu.kit.quak.infrastructure.lsp.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import edu.kit.quak.shared.tags.UnitTest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

@UnitTest
class LspServerStartupValidatorTest {

    private LspProperties properties;
    private LspServerStartupValidator validator;

    @BeforeEach
    void setUp() {
        properties = new LspProperties();
        validator = new LspServerStartupValidator(properties);
    }

    @Test
    void validate_doesNotThrow_whenNoServersConfigured() {
        assertDoesNotThrow(() -> validator.validate());
    }

    @Test
    void validate_doesNotThrow_whenServersMapIsNull() {
        // Verifies the null-guard fix
        properties.setServers(null);
        assertDoesNotThrow(() -> validator.validate());
    }

    @Test
    void validate_doesNotThrow_forRelativeCommandPath() {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of("pylsp"));
        properties.getServers().put("python", config);

        assertDoesNotThrow(() -> validator.validate());
    }

    @Test
    void validate_doesNotThrow_forAbsolutePathThatDoesNotExist(@TempDir Path dir) {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of(dir.resolve("nonexistent").toString()));
        properties.getServers().put("python", config);

        assertDoesNotThrow(() -> validator.validate());
    }

    @Test
    void validate_doesNotThrow_forAbsolutePathThatExists(@TempDir Path dir) throws IOException {
        Path binary = dir.resolve("fake-lsp");
        Files.createFile(binary);
        Files.setPosixFilePermissions(binary, PosixFilePermissions.fromString("rwxr-xr-x"));

        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of(binary.toString()));
        properties.getServers().put("python", config);

        assertDoesNotThrow(() -> validator.validate());
    }

    @Test
    void validate_doesNotThrow_whenCommandIsNull() {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(null);
        properties.getServers().put("python", config);

        assertDoesNotThrow(() -> validator.validate());
    }
}
