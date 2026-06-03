package edu.kit.quak.infrastructure.lsp.in.websocket;

import edu.kit.quak.application.lsp.ports.in.LspSessionServicePort;
import edu.kit.quak.core.lsp.model.LspLanguageId;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
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
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        String languageId = extractLanguageId(session);
        String lspSessionId = lspSessionServicePort.open(
            new LspLanguageId(languageId),
            new SpringWebSocketClientConnectionAdapter(session)
        );
        webSocketToLspSessionId.put(session.getId(), lspSessionId);
        log.info("Opened LSP WebSocket session={}, lspSession={}, language={}", session.getId(), lspSessionId, languageId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, @NonNull TextMessage message) throws Exception {
        String lspSessionId = webSocketToLspSessionId.get(session.getId());
        if (lspSessionId == null) {
            session.close(CloseStatus.SERVER_ERROR.withReason("No LSP session bound"));
            return;
        }
        lspSessionServicePort.onClientMessage(lspSessionId, message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, @NonNull CloseStatus status) {
        String lspSessionId = webSocketToLspSessionId.remove(session.getId());
        if (lspSessionId != null) {
            lspSessionServicePort.onClientClosed(lspSessionId);
        }
        log.info("Closed websocket session={} status={}", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, @NonNull Throwable exception) throws Exception {
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
