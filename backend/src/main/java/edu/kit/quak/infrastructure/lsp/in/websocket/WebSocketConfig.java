package edu.kit.quak.infrastructure.lsp.in.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final LspWebSocketExceptionHandler lspWebSocketExceptionHandler;
    private final String frontendUrl;
    private final long sessionIdleTimeoutMs;

    public WebSocketConfig(
        LspWebSocketExceptionHandler lspWebSocketExceptionHandler,
        @Value("${app.frontend.url}") String frontendUrl,
        @Value("${quak.lsp.websocket.session-idle-timeout-ms:1800000}") long sessionIdleTimeoutMs
    ) {
        this.lspWebSocketExceptionHandler = lspWebSocketExceptionHandler;
        this.frontendUrl = frontendUrl;
        this.sessionIdleTimeoutMs = sessionIdleTimeoutMs;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(lspWebSocketExceptionHandler, "/lsp/{languageId}").setAllowedOrigins(frontendUrl);
    }

    @Bean
    @ConditionalOnProperty(name = "quak.lsp.websocket.configure-container", havingValue = "true", matchIfMissing = true)
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(512 * 1024);
        container.setMaxSessionIdleTimeout(sessionIdleTimeoutMs);
        return container;
    }
}
