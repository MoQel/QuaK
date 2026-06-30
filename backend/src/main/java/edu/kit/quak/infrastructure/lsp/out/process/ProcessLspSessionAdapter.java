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
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.CloseStatus;

@Slf4j
public class ProcessLspSessionAdapter implements LspSessionPort {

    private final String sessionId;
    private final LspClientConnectionPort clientConnection;
    private final Runnable onTerminated;
    private final Duration terminationTimeout;
    private final AtomicBoolean open = new AtomicBoolean(false);
    private final AtomicBoolean terminated = new AtomicBoolean(false);

    private Process process;
    private StdioJsonRpcBridge bridge;
    private ExecutorService errorReaderExecutor;
    private Path sessionWorkspace;

    public ProcessLspSessionAdapter(
        String sessionId,
        LspClientConnectionPort clientConnection,
        Runnable onTerminated,
        long terminationTimeoutMs
    ) {
        this.sessionId = sessionId;
        this.clientConnection = clientConnection;
        this.onTerminated = onTerminated;
        this.terminationTimeout = Duration.ofMillis(terminationTimeoutMs);
    }

    @Override
    public void start(LspServerDefinition definition) throws IOException {
        sessionWorkspace = definition.workingDirectory().resolve(sessionId);
        Files.createDirectories(sessionWorkspace);

        ProcessBuilder processBuilder = new ProcessBuilder(definition.command());
        processBuilder.directory(sessionWorkspace.toFile());
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
    public void close() {
        terminate(false);
    }

    @Override
    public boolean isOpen() {
        return open.get();
    }

    private void readErrorStream(InputStream errorStream, String languageId) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(errorStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.debug("[LSP-{}] (session={}) {}", languageId, sessionId, line);
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
            terminate(false);
        }
    }

    private void handleServerClosed() {
        terminate(true);
    }

    private void terminate(boolean serverTerminatedUnexpectedly) {
        if (!terminated.compareAndSet(false, true)) {
            return;
        }

        open.set(false);
        try {
            if (bridge != null) {
                bridge.close();
            }
            shutdownErrorReader();
            terminateProcessTree();
            deleteSessionWorkspace();
            closeClientConnection(serverTerminatedUnexpectedly);
        } finally {
            onTerminated.run();
        }

        log.info(serverTerminatedUnexpectedly ? "LSP server terminated for session={}" : "Closed LSP session={}", sessionId);
    }

    private void shutdownErrorReader() {
        if (errorReaderExecutor != null) {
            errorReaderExecutor.shutdownNow();
        }
    }

    private void terminateProcessTree() {
        if (process == null) {
            return;
        }

        List<ProcessHandle> descendants = process.toHandle().descendants().toList();
        process.destroy();
        descendants.forEach(ProcessHandle::destroy);

        long deadlineNanos = System.nanoTime() + terminationTimeout.toNanos();
        waitForExit(process.toHandle(), deadlineNanos);
        descendants.forEach(handle -> waitForExit(handle, deadlineNanos));

        if (process.isAlive()) {
            process.destroyForcibly();
        }
        descendants.stream().filter(ProcessHandle::isAlive).forEach(ProcessHandle::destroyForcibly);

        long forcedDeadlineNanos = System.nanoTime() + terminationTimeout.toNanos();
        waitForExit(process.toHandle(), forcedDeadlineNanos);
        descendants.forEach(handle -> waitForExit(handle, forcedDeadlineNanos));
    }

    private void waitForExit(ProcessHandle handle, long deadlineNanos) {
        while (handle.isAlive()) {
            long remainingNanos = deadlineNanos - System.nanoTime();
            if (remainingNanos <= 0) {
                return;
            }
            try {
                handle.onExit().get(remainingNanos, TimeUnit.NANOSECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception e) {
                return;
            }
        }
    }

    private void closeClientConnection(boolean serverTerminatedUnexpectedly) {
        if (!clientConnection.isOpen()) {
            return;
        }

        try {
            if (serverTerminatedUnexpectedly) {
                clientConnection.close(CloseStatus.SERVER_ERROR.getCode(), "Language server terminated");
            } else {
                clientConnection.close(CloseStatus.NORMAL.getCode(), "LSP session closed");
            }
        } catch (Exception e) {
            log.warn("Failed to close client connection for session={}", sessionId, e);
        }
    }

    private void deleteSessionWorkspace() {
        if (sessionWorkspace == null || !Files.exists(sessionWorkspace)) {
            return;
        }
        try (var paths = Files.walk(sessionWorkspace)) {
            paths
                .sorted(Comparator.reverseOrder())
                .forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException e) {
                        log.warn("Failed to delete workspace file={}", path, e);
                    }
                });
            log.debug("Deleted session workspace={}", sessionWorkspace);
        } catch (IOException e) {
            log.warn("Failed to walk session workspace={} for cleanup", sessionWorkspace, e);
        }
    }

    private void ensureOpen() {
        if (!open.get()) {
            throw new IllegalStateException("LSP session is closed: " + sessionId);
        }
    }
}
