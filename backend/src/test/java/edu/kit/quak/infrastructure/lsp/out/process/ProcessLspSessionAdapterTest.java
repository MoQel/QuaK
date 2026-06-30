package edu.kit.quak.infrastructure.lsp.out.process;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.core.lsp.model.LspLanguageId;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import edu.kit.quak.shared.tags.UnitTest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class ProcessLspSessionAdapterTest {

    @Mock
    private LspClientConnectionPort clientConnection;

    @Mock
    private Runnable terminationCallback;

    private ProcessLspSessionAdapter adapter(String sessionId) {
        return new ProcessLspSessionAdapter(sessionId, clientConnection, terminationCallback, 200);
    }

    private static LspServerDefinition definitionFor(List<String> command, Path workDir) {
        return new LspServerDefinition(new LspLanguageId("test"), command, workDir, Map.of());
    }

    private static boolean awaitCreatedFile(WatchService watchService, Path fileName, Duration timeout) throws InterruptedException {
        long deadline = System.nanoTime() + timeout.toNanos();
        while (true) {
            long remainingNanos = deadline - System.nanoTime();
            if (remainingNanos <= 0) {
                return false;
            }

            WatchKey key = watchService.poll(remainingNanos, TimeUnit.NANOSECONDS);
            if (key == null) {
                return false;
            }

            boolean found = key
                .pollEvents()
                .stream()
                .anyMatch(event -> fileName.equals(event.context()));
            boolean stillValid = key.reset();
            if (found || !stillValid) {
                return found;
            }
        }
    }

    // --- start() ---

    @Test
    void start_createsSessionWorkspaceDirectory(@TempDir Path workDir) throws IOException {
        // setup
        ProcessLspSessionAdapter adapter = adapter("sess-1");

        // execute
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));

        // verify
        assertTrue(Files.isDirectory(workDir.resolve("sess-1")));
        adapter.close();
    }

    @Test
    void start_makesAdapterOpen(@TempDir Path workDir) throws IOException {
        ProcessLspSessionAdapter adapter = adapter("sess-open");
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));

        assertTrue(adapter.isOpen());
        adapter.close();
    }

    @Test
    void start_throwsIoException_forNonexistentCommand(@TempDir Path workDir) {
        ProcessLspSessionAdapter adapter = adapter("sess-fail");
        LspServerDefinition def = definitionFor(List.of("/no/such/binary"), workDir);

        assertThrows(IOException.class, () -> adapter.start(def));
        assertFalse(adapter.isOpen());
    }

    // --- close() ---

    @Test
    void close_deletesSessionWorkspace(@TempDir Path workDir) throws IOException {
        // setup
        ProcessLspSessionAdapter adapter = adapter("sess-close");
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));
        Path workspace = workDir.resolve("sess-close");
        assertTrue(Files.exists(workspace));

        // execute
        adapter.close();

        // verify
        assertFalse(Files.exists(workspace), "Workspace should be deleted after close");
    }

    @Test
    void close_isIdempotent(@TempDir Path workDir) throws IOException {
        // setup
        ProcessLspSessionAdapter adapter = adapter("sess-idem");
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));

        // execute — should not throw
        adapter.close();
        assertDoesNotThrow(adapter::close);
    }

    @Test
    void close_makesAdapterClosed(@TempDir Path workDir) throws IOException {
        ProcessLspSessionAdapter adapter = adapter("sess-2");
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));
        adapter.close();

        assertFalse(adapter.isOpen());
    }

    @Test
    void close_forceTerminatesStubbornProcessTree_andInvokesCallbackOnce(@TempDir Path workDir) throws Exception {
        AtomicInteger terminationCallbacks = new AtomicInteger();
        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter(
            "sess-stubborn",
            clientConnection,
            terminationCallbacks::incrementAndGet,
            100
        );
        Path workspace = Files.createDirectories(workDir.resolve("sess-stubborn"));
        Path childPidFile = workspace.resolve("child.pid");
        long childPid;

        try (WatchService watchService = workspace.getFileSystem().newWatchService()) {
            workspace.register(watchService, StandardWatchEventKinds.ENTRY_CREATE);
            adapter.start(
                definitionFor(
                    List.of(
                        "sh",
                        "-c",
                        "sleep 30 & child=$!; printf '%s' \"$child\" > child.pid.tmp; mv child.pid.tmp child.pid; trap '' TERM; wait"
                    ),
                    workDir
                )
            );

            assertTrue(awaitCreatedFile(watchService, Path.of("child.pid"), Duration.ofSeconds(5)), "Child PID file should be published");
            childPid = Long.parseLong(Files.readString(childPidFile).trim());
        } finally {
            adapter.close();
        }

        adapter.close();

        ProcessHandle child = ProcessHandle.of(childPid).orElse(null);
        assertTrue(child == null || !child.isAlive(), "Child process should be terminated");
        assertEquals(1, terminationCallbacks.get());
    }

    // --- server crash (handleServerClosed) ---

    @Test
    void serverCrash_deletesSessionWorkspace(@TempDir Path workDir) throws Exception {
        // handleServerClosed deletes the workspace BEFORE calling clientConnection.close(),
        // so when the latch fires the workspace is guaranteed to be gone already.
        CountDownLatch crashLatch = new CountDownLatch(1);
        when(clientConnection.isOpen()).thenReturn(true);
        doAnswer(inv -> {
            crashLatch.countDown();
            return null;
        })
            .when(clientConnection)
            .close(anyInt(), any());

        ProcessLspSessionAdapter adapter = adapter("sess-crash");
        adapter.start(definitionFor(List.of("sh", "-c", "exit 0"), workDir));

        Path workspace = workDir.resolve("sess-crash");
        assertTrue(crashLatch.await(5, TimeUnit.SECONDS), "handleServerClosed should have called clientConnection.close()");
        assertFalse(Files.exists(workspace), "Workspace must be deleted after unexpected server termination");
    }

    @Test
    void serverCrash_closesClientConnection(@TempDir Path workDir) throws Exception {
        CountDownLatch crashLatch = new CountDownLatch(1);
        when(clientConnection.isOpen()).thenReturn(true);
        doAnswer(inv -> {
            crashLatch.countDown();
            return null;
        })
            .when(clientConnection)
            .close(anyInt(), any());

        ProcessLspSessionAdapter adapter = adapter("sess-3");
        adapter.start(definitionFor(List.of("sh", "-c", "exit 0"), workDir));

        assertTrue(crashLatch.await(5, TimeUnit.SECONDS));
        verify(clientConnection).close(eq(1011), any());
    }
}
