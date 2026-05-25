package edu.kit.quak.infrastructure.lsp.in.websocket;

import edu.kit.quak.application.lsp.exceptions.LspInfrastructureException;
import edu.kit.quak.application.lsp.ports.in.LspSessionServicePort;
import edu.kit.quak.core.lsp.model.LspLanguage;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Slf4j
public class LspWebSocketHandler extends TextWebSocketHandler {

    private final LspSessionServicePort lspSessionServicePort;
    private final Map<String, String> webSocketToLspSessionId = new ConcurrentHashMap<>();

    public LspWebSocketHandler(LspSessionServicePort lspSessionServicePort) {
        this.lspSessionServicePort = lspSessionServicePort;
    }

    @Override
    public void afterConnectionEstablished(@NotNull WebSocketSession session) throws Exception {
        try {
            String languageId = extractLanguageId(session);
            String lspSessionId = lspSessionServicePort.open(
                LspLanguage.fromId(languageId),
                new SpringWebSocketClientConnectionAdapter(session)
            );
            webSocketToLspSessionId.put(session.getId(), lspSessionId);
            log.info("Opened LSP WebSocket session={}, lspSession={}, language={}", session.getId(), lspSessionId, languageId);
        } catch (LspInfrastructureException e) {
            log.error("Failed to open LSP WebSocket session", e);
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason(e.getMessage()));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, @NotNull TextMessage message) throws Exception {
        String lspSessionId = webSocketToLspSessionId.get(session.getId());
        if (lspSessionId == null) {
            session.close(CloseStatus.SERVER_ERROR.withReason("No LSP session bound"));
            return;
        }

        lspSessionServicePort.onClientMessage(lspSessionId, message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, @NotNull CloseStatus status) throws Exception {
        String lspSessionId = webSocketToLspSessionId.remove(session.getId());
        if (lspSessionId != null) {
            lspSessionServicePort.onClientClosed(lspSessionId);
        }
        log.info("Closed websocket session={} status={}", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, @NotNull Throwable exception) throws Exception {
        log.warn("Transport error for websocket={}", session.getId(), exception);
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR.withReason("Transport error"));
        }
    }

    private String extractLanguageId(WebSocketSession session) {
        URI uri = session.getUri();
        String path = uri != null ? uri.getPath() : "";
        return path.substring(path.lastIndexOf('/') + 1);
    }
}
