package edu.kit.quak.infrastructure.lsp.in.websocket;

import edu.kit.quak.application.lsp.exceptions.LspCommunicationException;
import edu.kit.quak.application.lsp.exceptions.LspSessionNotFoundException;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;

@Slf4j
public class LspWebSocketExceptionHandler extends WebSocketHandlerDecorator {

    public LspWebSocketExceptionHandler(WebSocketHandler delegate) {
        super(delegate);
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        try {
            super.afterConnectionEstablished(session);
        } catch (LspCommunicationException e) {
            log.error("LSP session could not be opened for session={}: {}", session.getId(), e.getMessage(), e);
            closeQuietly(session, CloseStatus.SERVER_ERROR.withReason("LSP unavailable"));
        } catch (Exception e) {
            log.error("Unexpected error establishing WebSocket session={}", session.getId(), e);
            closeQuietly(session, CloseStatus.SERVER_ERROR.withReason("Internal error"));
        }
    }

    @Override
    public void handleMessage(@NonNull WebSocketSession session, @NonNull WebSocketMessage<?> message) {
        try {
            super.handleMessage(session, message);
        } catch (LspSessionNotFoundException e) {
            log.warn("Message received for unknown LSP session={}: {}", session.getId(), e.getMessage());
            closeQuietly(session, CloseStatus.SERVER_ERROR.withReason("Session not found"));
        } catch (LspCommunicationException e) {
            log.error("LSP communication error for session={}", session.getId(), e);
            closeQuietly(session, CloseStatus.SERVER_ERROR.withReason("LSP communication error"));
        } catch (Exception e) {
            log.error("Unexpected error handling message for session={}", session.getId(), e);
            closeQuietly(session, CloseStatus.SERVER_ERROR.withReason("Internal error"));
        }
    }

    private void closeQuietly(WebSocketSession session, CloseStatus status) {
        try {
            if (session.isOpen()) {
                session.close(status);
            }
        } catch (IOException e) {
            log.debug("Failed to close WebSocket session={} cleanly after error", session.getId(), e);
        }
    }
}
