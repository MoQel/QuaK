package edu.kit.quak.infrastructure.lsp.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Validates LSP server configuration at startup.
 * Logs warnings for missing or non-executable binaries.
 */
@Slf4j
@Component
public class LspServerStartupValidator {

    private final LspProperties properties;

    public LspServerStartupValidator(LspProperties properties) {
        this.properties = properties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validate() {
        Map<String, LspProperties.ServerConfig> servers = properties.getServers();

        if (servers.isEmpty()) {
            log.info("LSP: No language servers configured. LSP support is disabled.");
            return;
        }

        for (Map.Entry<String, LspProperties.ServerConfig> entry : servers.entrySet()) {
            validateServer(entry.getKey(), entry.getValue());
        }
    }

    private void validateServer(String language, LspProperties.ServerConfig config) {
        List<String> command = config.getCommand();

        if (command == null || command.isEmpty()) {
            log.warn("LSP [{}]: No command configured — server will not be available.", language);
            return;
        }

        String binary = command.getFirst();
        Path binaryPath = Path.of(binary);

        if (binaryPath.isAbsolute()) {
            if (!Files.exists(binaryPath)) {
                log.warn("LSP [{}]: Binary not found at '{}' — server will not be available.", language, binary);
            } else if (!Files.isExecutable(binaryPath)) {
                log.warn("LSP [{}]: Binary '{}' exists but is not executable.", language, binary);
            } else {
                log.info("LSP [{}]: Binary found at '{}'.", language, binary);
            }
        } else {
            log.info("LSP [{}]: Command '{}' configured (resolved via PATH at runtime).", language, binary);
        }
    }
}
