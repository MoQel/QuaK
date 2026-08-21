package edu.kit.quak.infrastructure.lsp.config;

import edu.kit.quak.application.lsp.ports.in.LspSessionServicePort;
import edu.kit.quak.application.lsp.ports.out.LspServerRegistryPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionFactoryPort;
import edu.kit.quak.application.lsp.services.LspSessionService;
import edu.kit.quak.infrastructure.lsp.out.process.ProcessLspSessionAdapter;
import edu.kit.quak.infrastructure.lsp.out.registry.DefaultLspServerRegistry;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(LspProperties.class)
public class LspConfiguration {

    @Bean
    public LspServerRegistryPort lspServerRegistryPort(LspProperties properties) {
        return new DefaultLspServerRegistry(properties);
    }

    @Bean
    public LspSessionFactoryPort lspSessionFactory(LspProperties properties) {
        return (sessionId, connection, onTerminated) ->
            new ProcessLspSessionAdapter(sessionId, connection, onTerminated, properties.getProcess().getTerminationTimeoutMs());
    }

    @Bean
    public LspSessionServicePort lspSessionService(
        LspServerRegistryPort registryPort,
        LspSessionFactoryPort sessionFactory,
        LspProperties properties
    ) {
        validateLimits(properties);
        return new LspSessionService(
            registryPort,
            sessionFactory,
            properties.getLimits().getMaxProcesses(),
            properties.getLimits().getMaxProcessesPerUser()
        );
    }

    private void validateLimits(LspProperties properties) {
        int maxProcesses = properties.getLimits().getMaxProcesses();
        int maxProcessesPerUser = properties.getLimits().getMaxProcessesPerUser();
        int configuredLanguages = properties.getServers() == null ? 0 : properties.getServers().size();

        if (maxProcesses <= 0) {
            throw new IllegalStateException("quak.lsp.limits.max-processes must be greater than zero");
        }
        if (maxProcessesPerUser <= 0) {
            throw new IllegalStateException("quak.lsp.limits.max-processes-per-user must be greater than zero");
        }
        if (maxProcessesPerUser < configuredLanguages) {
            throw new IllegalStateException(
                "quak.lsp.limits.max-processes-per-user must be at least the number of configured LSP languages"
            );
        }
        if (maxProcesses < maxProcessesPerUser) {
            throw new IllegalStateException("quak.lsp.limits.max-processes must be greater than or equal to max-processes-per-user");
        }
        if (properties.getProcess().getTerminationTimeoutMs() <= 0) {
            throw new IllegalStateException("quak.lsp.process.termination-timeout-ms must be greater than zero");
        }
    }
}
