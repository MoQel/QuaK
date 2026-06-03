package edu.kit.quak.infrastructure.lsp.out.process;

import edu.kit.quak.application.lsp.exceptions.LspCommunicationException;
import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionPort;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import edu.kit.quak.infrastructure.lsp.exceptions.LspInfrastructureException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ProcessLspSessionAdapter implements LspSessionPort {

    private final String sessionId;
    private final LspClientConnectionPort clientConnection;
    private final AtomicBoolean open = new AtomicBoolean(false);

    private Process process;
    private StdioJsonRpcBridge bridge;
    private ExecutorService errorReaderExecutor;

    public ProcessLspSessionAdapter(String sessionId, LspClientConnectionPort clientConnection) {
        this.sessionId = sessionId;
        this.clientConnection = clientConnection;
    }

    @Override
    public void start(LspServerDefinition definition) throws IOException {
        Path workingDirectory = definition.workingDirectory();
        Files.createDirectories(workingDirectory);

        ProcessBuilder processBuilder = new ProcessBuilder(definition.command());
        processBuilder.directory(workingDirectory.toFile());
        processBuilder.environment().putAll(definition.environment());

        process = processBuilder.start();

        String languageId = definition.language().value();
        errorReaderExecutor = Executors.newSingleThreadExecutor();
        errorReaderExecutor.submit(() -> readErrorStream(process.getErrorStream(), languageId));

        bridge = new StdioJsonRpcBridge(
            process.getInputStream(),
            process.getOutputStream(),
            this::forwardToClient,
            this::handleServerClosed
        );

        open.set(true);
        bridge.start();

        log.info(
            "Started LSP process for session={} language={} command={}",
            sessionId,
            definition.language().value(),
            definition.command()
        );
    }

    @Override
    public void sendToServer(String message) {
        ensureOpen();
        try {
            bridge.send(message);
        } catch (LspInfrastructureException e) {
            throw new LspCommunicationException("Failed to send message to LSP server for session=" + sessionId, e);
        }
    }

    @Override
    public void close() throws IOException {
        if (!open.compareAndSet(true, false)) {
            return;
        }

        if (bridge != null) {
            bridge.close();
        }

        if (errorReaderExecutor != null) {
            errorReaderExecutor.shutdownNow();
        }

        if (process != null && process.isAlive()) {
            process.destroy();
        }

        if (clientConnection.isOpen()) {
            try {
                clientConnection.close(1000, "LSP session closed");
            } catch (Exception e) {
                log.warn("Failed to close LSP session", e);
            }
        }

        log.info("Closed LSP session={}", sessionId);
    }

    @Override
    public boolean isOpen() {
        return open.get();
    }

    private void readErrorStream(InputStream errorStream, String languageId) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(errorStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.warn("[LSP-{}] (session={}) {}", languageId, sessionId, line);
            }
        } catch (IOException e) {
            log.debug("LSP stderr stream closed for session={}", sessionId);
        }
    }

    private void forwardToClient(String message) {
        if (!open.get()) {
            return;
        }

        try {
            if (clientConnection.isOpen()) {
                clientConnection.sendToClient(message);
            }
        } catch (Exception e) {
            log.warn("Failed to forward LSP response to client, closing session={}", sessionId, e);
            try {
                close();
            } catch (IOException closingError) {
                log.debug("Error while force-closing session after forward failure", closingError);
            }
        }
    }

    private void handleServerClosed() {
        if (!open.compareAndSet(true, false)) {
            return;
        }

        try {
            if (clientConnection.isOpen()) {
                clientConnection.close(1011, "Language server terminated");
            }
        } catch (Exception e) {
            log.warn("Failed to cleanly notify client about server termination for session={}", sessionId, e);
        }

        if (process != null && process.isAlive()) {
            process.destroy();
        }

        if (errorReaderExecutor != null) {
            errorReaderExecutor.shutdownNow();
        }

        log.info("LSP server terminated for session={}", sessionId);
    }

    private void ensureOpen() {
        if (!open.get()) {
            throw new IllegalStateException("LSP session is closed: " + sessionId);
        }
    }
}
