package edu.kit.quak.infrastructure.lsp.out.registry;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.lsp.model.LspLanguageId;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import edu.kit.quak.infrastructure.lsp.config.LspProperties;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@UnitTest
class DefaultLspServerRegistryTest {

    private LspProperties properties;
    private DefaultLspServerRegistry registry;

    @BeforeEach
    void setUp() {
        properties = new LspProperties();
        registry = new DefaultLspServerRegistry(properties);
    }

    @Test
    void findByLanguage_returnsDefinition_whenLanguageConfigured() {
        // setup
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of("python3", "-m", "pylsp"));
        config.setWorkingDirectory("/tmp/lsp");
        properties.getServers().put("python", config);

        // execute
        Optional<LspServerDefinition> result = registry.findByLanguage(new LspLanguageId("python"));

        // verify
        assertTrue(result.isPresent());
        assertEquals("python", result.get().language().value());
        assertEquals(List.of("python3", "-m", "pylsp"), result.get().command());
    }

    @Test
    void findByLanguage_returnsEmpty_whenLanguageNotConfigured() {
        Optional<LspServerDefinition> result = registry.findByLanguage(new LspLanguageId("cobol"));
        assertTrue(result.isEmpty());
    }

    @Test
    void findByLanguage_returnsEmpty_whenCommandIsNull() {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(null);
        properties.getServers().put("python", config);

        Optional<LspServerDefinition> result = registry.findByLanguage(new LspLanguageId("python"));
        assertTrue(result.isEmpty());
    }

    @Test
    void findByLanguage_returnsEmpty_whenCommandIsEmpty() {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of());
        properties.getServers().put("python", config);

        Optional<LspServerDefinition> result = registry.findByLanguage(new LspLanguageId("python"));
        assertTrue(result.isEmpty());
    }

    @Test
    void findByLanguage_usesAbsoluteWorkingDirectory() {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of("pylsp"));
        config.setWorkingDirectory("/tmp/work");
        properties.getServers().put("python", config);

        Optional<LspServerDefinition> result = registry.findByLanguage(new LspLanguageId("python"));

        assertTrue(result.isPresent());
        assertTrue(result.get().workingDirectory().isAbsolute());
        assertTrue(result.get().workingDirectory().toString().contains("tmp"));
    }

    @Test
    void findByLanguage_usesDefaultWorkingDirectory_whenNotConfigured() {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of("pylsp"));
        properties.getServers().put("python", config);

        Optional<LspServerDefinition> result = registry.findByLanguage(new LspLanguageId("python"));

        assertTrue(result.isPresent());
        assertNotNull(result.get().workingDirectory());
        assertTrue(result.get().workingDirectory().isAbsolute());
    }

    @Test
    void findByLanguage_includesEnvironmentFromConfig() {
        LspProperties.ServerConfig config = new LspProperties.ServerConfig();
        config.setCommand(List.of("pylsp"));
        config.getEnvironment().put("PYTHONPATH", "/src");
        properties.getServers().put("python", config);

        Optional<LspServerDefinition> result = registry.findByLanguage(new LspLanguageId("python"));

        assertTrue(result.isPresent());
        assertEquals("/src", result.get().environment().get("PYTHONPATH"));
    }
}
