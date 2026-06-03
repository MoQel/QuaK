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
    public LspSessionFactoryPort lspSessionFactory() {
        return ProcessLspSessionAdapter::new;
    }

    @Bean
    public LspSessionServicePort lspSessionService(LspServerRegistryPort registryPort, LspSessionFactoryPort sessionFactory) {
        return new LspSessionService(registryPort, sessionFactory);
    }
}
