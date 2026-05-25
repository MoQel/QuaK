package edu.kit.quak.infrastructure.lsp.config;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "quak.lsp")
public class LspProperties {

    private Map<String, ServerConfig> servers = new HashMap<>();

    @Setter
    @Getter
    public static class ServerConfig {

        private List<String> command;
        private String workingDirectory;
        private Map<String, String> environment = new HashMap<>();
    }
}
