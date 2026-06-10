package edu.kit.quak.application.lsp.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.lsp.exceptions.LspCapacityExceededException;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
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
        service = new LspSessionService(registry, sessionFactory, 4, 2);
    }

    private LspServerDefinition dummyDefinition() {
        return new LspServerDefinition(new LspLanguageId("python"), List.of("pylsp"), Path.of("/tmp"), Map.of());
    }

    private void configureSuccessfulOpen() {
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any(), any())).thenReturn(session);
    }

    @Test
    void open_returnsSessionId_whenSuccessful() throws IOException {
        configureSuccessfulOpen();

        String sessionId = service.open("user-1", new LspLanguageId("python"), clientConnection);

        assertNotNull(sessionId);
        assertFalse(sessionId.isBlank());
        verify(session).start(any());
    }

    @Test
    void open_throwsLspServerNotConfiguredException_whenLanguageUnknown() {
        when(registry.findByLanguage(any())).thenReturn(Optional.empty());
        LspLanguageId language = new LspLanguageId("cobol");

        assertThrows(LspServerNotConfiguredException.class, () -> service.open("user-1", language, clientConnection));
    }

    @Test
    void open_closesSessionAndReleasesCapacity_whenStartFails() throws IOException {
        service = new LspSessionService(registry, sessionFactory, 1, 1);
        configureSuccessfulOpen();
        doThrow(new IOException("process failed")).doNothing().when(session).start(any());
        LspLanguageId language = new LspLanguageId("python");

        assertThrows(LspCommunicationException.class, () -> service.open("user-1", language, clientConnection));
        assertDoesNotThrow(() -> service.open("user-1", language, clientConnection));
        verify(session).close();
    }

    @Test
    void open_suppressesCloseException_whenBothStartAndCloseFail() throws IOException {
        configureSuccessfulOpen();
        doThrow(new IOException("start failed")).when(session).start(any());
        doThrow(new IOException("close failed")).when(session).close();
        LspLanguageId language = new LspLanguageId("python");

        LspCommunicationException exception = assertThrows(LspCommunicationException.class, () ->
            service.open("user-1", language, clientConnection)
        );

        assertEquals(1, exception.getCause().getSuppressed().length);
        assertEquals("close failed", exception.getCause().getSuppressed()[0].getMessage());
    }

    @Test
    void onClientMessage_forwardsMessageToSession() {
        configureSuccessfulOpen();
        when(session.isOpen()).thenReturn(true);
        String sessionId = service.open("user-1", new LspLanguageId("python"), clientConnection);

        service.onClientMessage(sessionId, "{\"method\":\"initialize\"}");

        verify(session).sendToServer("{\"method\":\"initialize\"}");
    }

    @Test
    void onClientMessage_throwsSessionNotFound_whenIdUnknownOrSessionClosed() {
        assertThrows(LspSessionNotFoundException.class, () -> service.onClientMessage("unknown-session", "{}"));

        configureSuccessfulOpen();
        when(session.isOpen()).thenReturn(false);
        String sessionId = service.open("user-1", new LspLanguageId("python"), clientConnection);
        assertThrows(LspSessionNotFoundException.class, () -> service.onClientMessage(sessionId, "{}"));
    }

    @Test
    void onClientClosed_closesAndRemovesSession() throws IOException {
        configureSuccessfulOpen();
        String sessionId = service.open("user-1", new LspLanguageId("python"), clientConnection);

        service.onClientClosed(sessionId);

        verify(session).close();
        assertThrows(LspSessionNotFoundException.class, () -> service.onClientMessage(sessionId, "{}"));
        assertDoesNotThrow(() -> service.onClientClosed("unknown-session"));
    }

    @Test
    void open_rejectsThirdProcessForSameUser() {
        configureSuccessfulOpen();

        service.open("user-1", new LspLanguageId("python"), clientConnection);
        service.open("user-1", new LspLanguageId("python"), clientConnection);
        LspLanguageId language = new LspLanguageId("python");

        LspCapacityExceededException exception = assertThrows(LspCapacityExceededException.class, () ->
            service.open("user-1", language, clientConnection)
        );
        assertEquals(LspCapacityExceededException.Limit.USER, exception.getLimit());
    }

    @Test
    void open_rejectsWhenGlobalLimitIsReached() {
        service = new LspSessionService(registry, sessionFactory, 1, 1);
        configureSuccessfulOpen();
        service.open("user-1", new LspLanguageId("python"), clientConnection);
        LspLanguageId language = new LspLanguageId("python");

        LspCapacityExceededException exception = assertThrows(LspCapacityExceededException.class, () ->
            service.open("user-2", language, clientConnection)
        );
        assertEquals(LspCapacityExceededException.Limit.GLOBAL, exception.getLimit());
    }

    @Test
    void concurrentOpens_neverExceedUserLimit() throws Exception {
        int attempts = 12;
        configureSuccessfulOpen();
        CountDownLatch ready = new CountDownLatch(attempts);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successfulOpens = new AtomicInteger();
        LspLanguageId language = new LspLanguageId("python");

        try (var executor = Executors.newFixedThreadPool(attempts)) {
            for (int i = 0; i < attempts; i++) {
                executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    try {
                        service.open("user-1", language, clientConnection);
                        successfulOpens.incrementAndGet();
                    } catch (LspCapacityExceededException ignored) {
                        // Expected after the two reservations are taken.
                    }
                    return null;
                });
            }

            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            executor.shutdown();
            assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));
        }

        assertEquals(2, successfulOpens.get());
    }

    @Test
    void terminatedSession_releasesCapacityAndRemovesRegistryEntry() {
        service = new LspSessionService(registry, sessionFactory, 1, 1);
        AtomicReference<Runnable> terminationCallback = new AtomicReference<>();
        when(registry.findByLanguage(any())).thenReturn(Optional.of(dummyDefinition()));
        when(sessionFactory.create(anyString(), any(), any())).thenAnswer(invocation -> {
            terminationCallback.set(invocation.getArgument(2));
            return session;
        });
        String sessionId = service.open("user-1", new LspLanguageId("python"), clientConnection);
        terminationCallback.get().run();

        assertThrows(LspSessionNotFoundException.class, () -> service.onClientMessage(sessionId, "{}"));
        LspLanguageId language = new LspLanguageId("python");
        assertDoesNotThrow(() -> service.open("user-1", language, clientConnection));
    }

    @Test
    void shutdown_closesSessionsAndRejectsNewOnes() throws IOException {
        configureSuccessfulOpen();
        service.open("user-1", new LspLanguageId("python"), clientConnection);

        service.shutdown();

        verify(session).close();
        LspLanguageId language = new LspLanguageId("python");
        assertThrows(LspCommunicationException.class, () -> service.open("user-1", language, clientConnection));
    }
}
