package edu.kit.quak.infrastructure.lsp.out.registry;

import edu.kit.quak.application.lsp.ports.out.LspServerRegistryPort;
import edu.kit.quak.core.lsp.model.LspLanguage;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import edu.kit.quak.infrastructure.lsp.config.LspProperties;
import java.nio.file.Path;
import java.util.Optional;

public class DefaultLspServerRegistry implements LspServerRegistryPort {

    private final LspProperties properties;

    public DefaultLspServerRegistry(LspProperties properties) {
        this.properties = properties;
    }

    @Override
    public Optional<LspServerDefinition> findByLanguage(LspLanguage language) {
        LspProperties.ServerConfig config = properties.getServers().get(language.id());
        if (config == null || config.getCommand() == null || config.getCommand().isEmpty()) {
            return Optional.empty();
        }

        Path workingDirectory =
            config.getWorkingDirectory() == null
                ? Path.of(".").toAbsolutePath().normalize()
                : Path.of(config.getWorkingDirectory()).toAbsolutePath().normalize();

        return Optional.of(new LspServerDefinition(language, config.getCommand(), workingDirectory, config.getEnvironment()));
    }
}
