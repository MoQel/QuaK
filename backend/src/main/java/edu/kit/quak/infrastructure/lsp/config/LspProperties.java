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
    private Limits limits = new Limits();
    private Process process = new Process();

    @Setter
    @Getter
    public static class Limits {

        private int maxProcesses = 40;
        private int maxProcessesPerUser = 4;
    }

    @Setter
    @Getter
    public static class Process {

        private long terminationTimeoutMs = 2000;
    }

    @Setter
    @Getter
    public static class ServerConfig {

        private List<String> command;
        private String workingDirectory;
        private Map<String, String> environment = new HashMap<>();
    }
}
