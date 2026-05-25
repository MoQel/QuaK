package edu.kit.quak.infrastructure.lsp.config;

import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.application.lsp.ports.out.LspServerRegistryPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionPort;
import edu.kit.quak.application.lsp.services.LspSessionService;
import edu.kit.quak.infrastructure.lsp.in.websocket.LspWebSocketHandler;
import edu.kit.quak.infrastructure.lsp.out.process.ProcessLspSessionAdapter;
import edu.kit.quak.infrastructure.lsp.out.registry.DefaultLspServerRegistry;
import java.util.function.BiFunction;
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
    public BiFunction<String, LspClientConnectionPort, LspSessionPort> lspSessionFactory() {
        return ProcessLspSessionAdapter::new;
    }

    @Bean
    public LspSessionService lspSessionService(
        LspServerRegistryPort registryPort,
        BiFunction<String, LspClientConnectionPort, LspSessionPort> sessionFactory
    ) {
        return new LspSessionService(registryPort, sessionFactory);
    }

    @Bean
    public LspWebSocketHandler lspWebSocketHandler(LspSessionService service) {
        return new LspWebSocketHandler(service);
    }
}
