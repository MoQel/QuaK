package edu.kit.quak.infrastructure.lsp.in.websocket;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.lsp.ports.in.LspSessionServicePort;
import edu.kit.quak.core.lsp.exceptions.InvalidLspLanguageIdException;
import edu.kit.quak.core.lsp.model.LspLanguageId;
import edu.kit.quak.shared.tags.UnitTest;
import java.net.URI;
import java.util.Objects;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@UnitTest
@ExtendWith(MockitoExtension.class)
class LspWebSocketHandlerTest {

    @Mock
    private LspSessionServicePort service;

    @Mock
    private WebSocketSession wsSession;

    private LspWebSocketHandler handler;

    @BeforeEach
    void setUp() throws Exception {
        handler = new LspWebSocketHandler(service);
        lenient().when(wsSession.getId()).thenReturn("ws-1");
        lenient().when(wsSession.getUri()).thenReturn(new URI("/lsp/python"));
        lenient()
            .when(wsSession.getPrincipal())
            .thenReturn(() -> "user-1");
    }

    // --- afterConnectionEstablished ---

    @Test
    void afterConnectionEstablished_opensLspSessionWithCorrectLanguage() {
        // setup
        when(service.open(anyString(), any(), any())).thenReturn("lsp-1");

        // execute
        handler.afterConnectionEstablished(wsSession);

        // verify language is extracted from URL path
        ArgumentCaptor<LspLanguageId> langCaptor = ArgumentCaptor.forClass(LspLanguageId.class);
        verify(service).open(
            eq(Objects.requireNonNull(wsSession.getPrincipal()).getClass().getName() + ":user-1"),
            langCaptor.capture(),
            any(SpringWebSocketClientConnectionAdapter.class)
        );
        assertEquals("python", langCaptor.getValue().value());
    }

    @Test
    void afterConnectionEstablished_storesLspSessionIdForRouting() throws Exception {
        // setup
        when(service.open(anyString(), any(), any())).thenReturn("lsp-42");

        // execute connection + message
        handler.afterConnectionEstablished(wsSession);
        handler.handleMessage(wsSession, new TextMessage("{}"));

        // verify the message was routed to the correct lsp session
        verify(service).onClientMessage("lsp-42", "{}");
    }

    // --- handleTextMessage ---

    @Test
    void handleTextMessage_forwardsPayloadToService() throws Exception {
        // setup: establish connection first
        when(service.open(anyString(), any(), any())).thenReturn("lsp-1");
        handler.afterConnectionEstablished(wsSession);

        // execute
        handler.handleMessage(wsSession, new TextMessage("{\"method\":\"initialize\"}"));

        // verify
        verify(service).onClientMessage("lsp-1", "{\"method\":\"initialize\"}");
    }

    @Test
    void handleTextMessage_closesSession_whenNoLspSessionBound() throws Exception {
        // no afterConnectionEstablished called → no mapping; close() is unconditional here

        handler.handleMessage(wsSession, new TextMessage("{}"));

        verify(wsSession).close(any(CloseStatus.class));
    }

    // --- afterConnectionClosed ---

    @Test
    void afterConnectionClosed_notifiesService() {
        // setup: open first
        when(service.open(anyString(), any(), any())).thenReturn("lsp-1");
        handler.afterConnectionEstablished(wsSession);

        // execute
        handler.afterConnectionClosed(wsSession, CloseStatus.NORMAL);

        // verify
        verify(service).onClientClosed("lsp-1");
    }

    @Test
    void afterConnectionClosed_doesNothing_whenNoLspSessionBound() {
        // no connection was established
        assertDoesNotThrow(() -> handler.afterConnectionClosed(wsSession, CloseStatus.NORMAL));
        verify(service, never()).onClientClosed(any());
    }

    // --- handleTransportError ---

    @Test
    void handleTransportError_closesOpenSession() throws Exception {
        when(wsSession.isOpen()).thenReturn(true);

        handler.handleTransportError(wsSession, new RuntimeException("network error"));

        verify(wsSession).close(any(CloseStatus.class));
    }

    @Test
    void handleTransportError_doesNotCloseAlreadyClosedSession() throws Exception {
        when(wsSession.isOpen()).thenReturn(false);

        handler.handleTransportError(wsSession, new RuntimeException("network error"));

        verify(wsSession, never()).close(any());
    }

    // --- extractLanguageId validation ---

    @Test
    void afterConnectionEstablished_rejectsMissingLanguageId() {
        when(wsSession.getUri()).thenReturn(null);

        assertThrows(InvalidLspLanguageIdException.class, () -> handler.afterConnectionEstablished(wsSession));
        verify(service, never()).open(anyString(), any(), any());
    }

    @Test
    void afterConnectionEstablished_rejectsTrailingSlash() throws Exception {
        when(wsSession.getUri()).thenReturn(new URI("/lsp/python/"));

        assertThrows(InvalidLspLanguageIdException.class, () -> handler.afterConnectionEstablished(wsSession));
        verify(service, never()).open(anyString(), any(), any());
    }
}
