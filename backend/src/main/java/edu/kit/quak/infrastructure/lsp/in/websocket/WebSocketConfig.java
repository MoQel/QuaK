package edu.kit.quak.infrastructure.lsp.in.websocket;

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

    public WebSocketConfig(LspWebSocketExceptionHandler lspWebSocketExceptionHandler) {
        this.lspWebSocketExceptionHandler = lspWebSocketExceptionHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(lspWebSocketExceptionHandler, "/lsp/{languageId}").setAllowedOrigins("http://localhost:5173"); // TODO: nonstatic registry
    }

    @Bean
    @ConditionalOnProperty(name = "quak.lsp.websocket.configure-container", havingValue = "true", matchIfMissing = true)
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(512 * 1024);
        container.setMaxSessionIdleTimeout(3600000L); // TODO: Find right timeout for production/timeout handling
        return container;
    }
}
