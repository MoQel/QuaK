package edu.kit.quak.application.lsp.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.lsp.exceptions.LspCommunicationException;
import edu.kit.quak.application.lsp.exceptions.LspServerNotConfiguredException;
import edu.kit.quak.application.lsp.exceptions.LspSessionNotFoundException;
import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.application.lsp.ports.out.LspServerRegistryPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionFactoryPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionPort;
import edu.kit.quak.core.lsp.model.LspLanguageId;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import edu.kit.quak.shared.tags.UnitTest;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class LspSessionServiceTest {

    @Mock
    private LspServerRegistryPort registry;

    @Mock
    private LspSessionFactoryPort sessionFactory;

    @Mock
    private LspSessionPort session;

    @Mock
    private LspClientConnectionPort clientConnection;

    private LspSessionService service;

    @BeforeEach
    void setUp() {
        service = new LspSessionService(registry, sessionFactory);
    }

    private LspServerDefinition dummyDefinition() {
        return new LspServerDefinition(new LspLanguageId("python"), List.of("pylsp"), Path.of("/tmp"), Map.of());
    }

    // --- open() ---

    @Test
    void open_returnsSessionId_whenSuccessful() throws IOException {
        // setup
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any())).thenReturn(session);

        // execute
        String sessionId = service.open(new LspLanguageId("python"), clientConnection);

        // verify
        assertNotNull(sessionId);
        assertFalse(sessionId.isBlank());
        verify(session).start(any());
    }

    @Test
    void open_throwsLspServerNotConfiguredException_whenLanguageUnknown() {
        // setup
        when(registry.findByLanguage(any())).thenReturn(Optional.empty());

        // execute & verify
        var language = new LspLanguageId("cobol");
        assertThrows(LspServerNotConfiguredException.class, () -> service.open(language, clientConnection));
    }

    @Test
    void open_closesSessionAndThrows_whenStartFails() throws IOException {
        // setup
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any())).thenReturn(session);
        doThrow(new IOException("process failed")).when(session).start(any());

        // execute & verify
        var language = new LspLanguageId("python");
        assertThrows(LspCommunicationException.class, () -> service.open(language, clientConnection));
        verify(session).close();
    }

    @Test
    void open_suppressesCloseException_whenBothStartAndCloseFail() throws IOException {
        // setup
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any())).thenReturn(session);
        doThrow(new IOException("start failed")).when(session).start(any());
        doThrow(new IOException("close failed")).when(session).close();

        // execute
        var language = new LspLanguageId("python");
        LspCommunicationException ex = assertThrows(LspCommunicationException.class, () -> service.open(language, clientConnection));

        // verify close exception is suppressed on the cause (the primary IOException)
        Throwable cause = ex.getCause();
        assertNotNull(cause);
        assertEquals(1, cause.getSuppressed().length);
        assertEquals("close failed", cause.getSuppressed()[0].getMessage());
    }

    // --- onClientMessage() ---

    @Test
    void onClientMessage_forwardsMessageToSession() {
        // setup: open a session first
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any())).thenReturn(session);
        when(session.isOpen()).thenReturn(true);
        String sessionId = service.open(new LspLanguageId("python"), clientConnection);

        // execute
        service.onClientMessage(sessionId, "{\"method\":\"initialize\"}");

        // verify
        verify(session).sendToServer("{\"method\":\"initialize\"}");
    }

    @Test
    void onClientMessage_throwsSessionNotFound_whenIdUnknown() {
        assertThrows(LspSessionNotFoundException.class, () -> service.onClientMessage("unknown-session", "{}"));
    }

    @Test
    void onClientMessage_throwsSessionNotFound_whenSessionIsClosed() {
        // setup: session exists but is closed
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any())).thenReturn(session);
        when(session.isOpen()).thenReturn(false);
        String sessionId = service.open(new LspLanguageId("python"), clientConnection);

        // execute & verify
        assertThrows(LspSessionNotFoundException.class, () -> service.onClientMessage(sessionId, "{}"));
    }

    // --- onClientClosed() ---

    @Test
    void onClientClosed_closesSession_whenSessionExists() throws IOException {
        // setup
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any())).thenReturn(session);
        String sessionId = service.open(new LspLanguageId("python"), clientConnection);

        // execute
        service.onClientClosed(sessionId);

        // verify
        verify(session).close();
    }

    @Test
    void onClientClosed_doesNothing_whenSessionUnknown() {
        assertDoesNotThrow(() -> service.onClientClosed("unknown-session"));
    }

    @Test
    void onClientClosed_removesSessionFromRegistry_soSubsequentMessageFails() {
        // setup
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any())).thenReturn(session);
        String sessionId = service.open(new LspLanguageId("python"), clientConnection);

        // execute
        service.onClientClosed(sessionId);

        // verify the session is gone
        assertThrows(LspSessionNotFoundException.class, () -> service.onClientMessage(sessionId, "{}"));
    }
}
