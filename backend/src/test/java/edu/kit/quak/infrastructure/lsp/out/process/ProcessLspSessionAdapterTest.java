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
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
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

    private static LspServerDefinition definitionFor(List<String> command, Path workDir) {
        return new LspServerDefinition(new LspLanguageId("test"), command, workDir, Map.of());
    }

    // --- start() ---

    @Test
    void start_createsSessionWorkspaceDirectory(@TempDir Path workDir) throws IOException {
        // setup
        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-1", clientConnection);

        // execute
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));

        // verify
        assertTrue(Files.isDirectory(workDir.resolve("sess-1")));
        adapter.close();
    }

    @Test
    void start_makesAdapterOpen(@TempDir Path workDir) throws IOException {
        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-open", clientConnection);
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));

        assertTrue(adapter.isOpen());
        adapter.close();
    }

    @Test
    void start_throwsIoException_forNonexistentCommand(@TempDir Path workDir) {
        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-fail", clientConnection);
        LspServerDefinition def = definitionFor(List.of("/no/such/binary"), workDir);

        assertThrows(IOException.class, () -> adapter.start(def));
        assertFalse(adapter.isOpen());
    }

    // --- close() ---

    @Test
    void close_deletesSessionWorkspace(@TempDir Path workDir) throws IOException {
        // setup
        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-close", clientConnection);
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
        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-idem", clientConnection);
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));

        // execute — should not throw
        adapter.close();
        assertDoesNotThrow(adapter::close);
    }

    @Test
    void close_makesAdapterClosed(@TempDir Path workDir) throws IOException {
        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-2", clientConnection);
        adapter.start(definitionFor(List.of("sh", "-c", "cat"), workDir));
        adapter.close();

        assertFalse(adapter.isOpen());
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

        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-crash", clientConnection);
        adapter.start(definitionFor(List.of("sh", "-c", "exit 0"), workDir));

        Path workspace = workDir.resolve("sess-crash");
        assertTrue(Files.exists(workspace), "Workspace should exist right after start");

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

        ProcessLspSessionAdapter adapter = new ProcessLspSessionAdapter("sess-3", clientConnection);
        adapter.start(definitionFor(List.of("sh", "-c", "exit 0"), workDir));

        assertTrue(crashLatch.await(5, TimeUnit.SECONDS));
        verify(clientConnection).close(eq(1011), any());
    }
}
