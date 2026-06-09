package edu.kit.quak.infrastructure.lsp.in.websocket;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.lsp.exceptions.LspCommunicationException;
import edu.kit.quak.application.lsp.exceptions.LspServerNotConfiguredException;
import edu.kit.quak.application.lsp.exceptions.LspSessionNotFoundException;
import edu.kit.quak.core.lsp.exceptions.InvalidLspLanguageIdException;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;

@UnitTest
@ExtendWith(MockitoExtension.class)
class LspWebSocketExceptionHandlerTest {

    @Mock
    private WebSocketHandler delegate;

    @Mock
    private WebSocketSession session;

    private LspWebSocketExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new LspWebSocketExceptionHandler(delegate);
        lenient().when(session.isOpen()).thenReturn(true);
    }

    // --- afterConnectionEstablished ---

    @Test
    void afterConnectionEstablished_delegatesSuccessPath() throws Exception {
        handler.afterConnectionEstablished(session);
        verify(delegate).afterConnectionEstablished(session);
    }

    @Test
    void afterConnectionEstablished_closesSession_onLspCommunicationException() throws Exception {
        doThrow(new LspCommunicationException("LSP failed")).when(delegate).afterConnectionEstablished(session);

        handler.afterConnectionEstablished(session);

        verify(session).close(any(CloseStatus.class));
    }

    @Test
    void afterConnectionEstablished_closesWithBadData_onInvalidLanguageId() throws Exception {
        doThrow(new InvalidLspLanguageIdException("Language ID must not be blank")).when(delegate).afterConnectionEstablished(session);

        handler.afterConnectionEstablished(session);

        verify(session).close(argThat(status -> status.equalsCode(CloseStatus.BAD_DATA)));
    }

    @Test
    void afterConnectionEstablished_closesSession_onLspServerNotConfiguredException() throws Exception {
        // LspServerNotConfiguredException extends LspCommunicationException
        doThrow(new LspServerNotConfiguredException("cobol")).when(delegate).afterConnectionEstablished(session);

        handler.afterConnectionEstablished(session);

        verify(session).close(any(CloseStatus.class));
    }

    @Test
    void afterConnectionEstablished_closesSession_onUnexpectedException() throws Exception {
        doThrow(new RuntimeException("unexpected")).when(delegate).afterConnectionEstablished(session);

        handler.afterConnectionEstablished(session);

        verify(session).close(any(CloseStatus.class));
    }

    @Test
    void afterConnectionEstablished_doesNotCloseAlreadyClosedSession_onException() throws Exception {
        when(session.isOpen()).thenReturn(false);
        doThrow(new LspCommunicationException("LSP failed")).when(delegate).afterConnectionEstablished(session);

        handler.afterConnectionEstablished(session);

        verify(session, never()).close(any());
    }

    // --- handleMessage ---

    @Test
    void handleMessage_delegatesSuccessPath() throws Exception {
        TextMessage message = new TextMessage("{}");
        handler.handleMessage(session, message);
        verify(delegate).handleMessage(session, message);
    }

    @Test
    void handleMessage_closesSession_onLspSessionNotFoundException() throws Exception {
        doThrow(new LspSessionNotFoundException("sess-1")).when(delegate).handleMessage(eq(session), any());

        handler.handleMessage(session, new TextMessage("{}"));

        verify(session).close(any(CloseStatus.class));
    }

    @Test
    void handleMessage_closesSession_onLspCommunicationException() throws Exception {
        doThrow(new LspCommunicationException("io error")).when(delegate).handleMessage(eq(session), any());

        handler.handleMessage(session, new TextMessage("{}"));

        verify(session).close(any(CloseStatus.class));
    }

    @Test
    void handleMessage_closesSession_onUnexpectedException() throws Exception {
        doThrow(new RuntimeException("unexpected")).when(delegate).handleMessage(eq(session), any());

        handler.handleMessage(session, new TextMessage("{}"));

        verify(session).close(any(CloseStatus.class));
    }

    @Test
    void handleMessage_doesNotCloseAlreadyClosedSession_onException() throws Exception {
        when(session.isOpen()).thenReturn(false);
        doThrow(new LspSessionNotFoundException("sess-1")).when(delegate).handleMessage(eq(session), any());

        handler.handleMessage(session, new TextMessage("{}"));

        verify(session, never()).close(any());
    }
}
