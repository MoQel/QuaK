package edu.kit.quak.infrastructure.lsp.out.process;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.shared.tags.UnitTest;
import java.io.IOException;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

@UnitTest
class StdioJsonRpcBridgeTest {

    private record BridgeHarness(
        StdioJsonRpcBridge bridge,
        PipedOutputStream serverOutputWriter,
        PipedInputStream serverInputReader,
        List<String> received,
        CountDownLatch messageLatch,
        CountDownLatch closedLatch
    ) implements AutoCloseable {
        @Override
        public void close() {
            bridge.close();
        }
    }

    /**
     * Creates a bridge wired to piped streams so tests can inject server messages and
     * read what the bridge sends to the server.
     *
     * @param messageCount number of messages to expect before the messageLatch opens
     */
    private BridgeHarness buildHarness(int messageCount) throws IOException {
        PipedInputStream bridgeStdoutInput = new PipedInputStream(16 * 1024);
        PipedOutputStream serverOutputWriter = new PipedOutputStream(bridgeStdoutInput);

        PipedOutputStream bridgeStdinOutput = new PipedOutputStream();
        PipedInputStream serverInputReader = new PipedInputStream(bridgeStdinOutput, 16 * 1024);

        List<String> received = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch messageLatch = new CountDownLatch(messageCount);
        CountDownLatch closedLatch = new CountDownLatch(1);

        StdioJsonRpcBridge bridge = new StdioJsonRpcBridge(
            bridgeStdoutInput,
            bridgeStdinOutput,
            msg -> {
                received.add(msg);
                messageLatch.countDown();
            },
            closedLatch::countDown
        );
        bridge.start();

        return new BridgeHarness(bridge, serverOutputWriter, serverInputReader, received, messageLatch, closedLatch);
    }

    private static void writeFrame(PipedOutputStream out, String json) throws IOException {
        byte[] payload = json.getBytes(StandardCharsets.UTF_8);
        String header = "Content-Length: " + payload.length + "\r\n\r\n";
        out.write(header.getBytes(StandardCharsets.US_ASCII));
        out.write(payload);
        out.flush();
    }

    private static void writeRaw(PipedOutputStream out, String raw) throws IOException {
        out.write(raw.getBytes(StandardCharsets.US_ASCII));
        out.flush();
    }

    // --- send() ---

    @Test
    void send_writesContentLengthHeaderAndPayload() throws Exception {
        try (BridgeHarness h = buildHarness(0)) {
            String json = "{\"id\":1}";
            h.bridge().send(json);

            byte[] payload = json.getBytes(StandardCharsets.UTF_8);
            String expectedHeader = "Content-Length: " + payload.length + "\r\n\r\n";
            int totalLength = expectedHeader.getBytes(StandardCharsets.US_ASCII).length + payload.length;

            byte[] written = h.serverInputReader().readNBytes(totalLength);
            String frame = new String(written, StandardCharsets.US_ASCII);

            assertTrue(frame.startsWith("Content-Length: " + payload.length + "\r\n\r\n"));
            assertTrue(frame.endsWith(json));
        }
    }

    @Test
    void send_usesUtf8ByteLengthInHeader() throws Exception {
        try (BridgeHarness h = buildHarness(0)) {
            // "ä" is 2 bytes in UTF-8, not 1 character
            String json = "{\"v\":\"ä\"}";
            h.bridge().send(json);

            byte[] payload = json.getBytes(StandardCharsets.UTF_8);
            byte[] headerBytes = ("Content-Length: " + payload.length + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII);
            byte[] written = h.serverInputReader().readNBytes(headerBytes.length + payload.length);

            String header = new String(written, 0, headerBytes.length, StandardCharsets.US_ASCII);
            assertTrue(header.contains("Content-Length: " + payload.length));
        }
    }

    // --- receive / readLoop ---

    @Test
    void readLoop_parsesIncomingMessage() throws Exception {
        try (BridgeHarness h = buildHarness(1)) {
            writeFrame(h.serverOutputWriter(), "{\"result\":42}");

            assertTrue(h.messageLatch().await(3, TimeUnit.SECONDS), "Message not received in time");
            assertEquals(1, h.received().size());
            assertEquals("{\"result\":42}", h.received().getFirst());
        }
    }

    @Test
    void readLoop_parsesMultipleSequentialMessages() throws Exception {
        try (BridgeHarness h = buildHarness(2)) {
            writeFrame(h.serverOutputWriter(), "{\"id\":1}");
            writeFrame(h.serverOutputWriter(), "{\"id\":2}");

            assertTrue(h.messageLatch().await(3, TimeUnit.SECONDS));
            assertEquals(2, h.received().size());
            assertEquals("{\"id\":1}", h.received().get(0));
            assertEquals("{\"id\":2}", h.received().get(1));
        }
    }

    @Test
    void readLoop_callsOnServerClosed_whenStreamEnds() throws Exception {
        try (BridgeHarness h = buildHarness(0)) {
            // Closing the write end signals EOF to the bridge reader
            h.serverOutputWriter().close();

            assertTrue(h.closedLatch().await(3, TimeUnit.SECONDS), "onServerClosed should be called on EOF");
        }
    }

    @Test
    void readLoop_skipsZeroContentLength_andContinuesReading() throws Exception {
        try (BridgeHarness h = buildHarness(1)) {
            // A Content-Length: 0 frame should not terminate the loop
            writeRaw(h.serverOutputWriter(), "Content-Length: 0\r\n\r\n");
            writeFrame(h.serverOutputWriter(), "{\"id\":99}");

            assertTrue(h.messageLatch().await(3, TimeUnit.SECONDS), "Valid message after empty content-length should be received");
            assertEquals("{\"id\":99}", h.received().getFirst());
        }
    }

    @Test
    void readLoop_parsesCaseInsensitiveContentLengthHeader() throws Exception {
        try (BridgeHarness h = buildHarness(1)) {
            String json = "{\"ok\":true}";
            byte[] payload = json.getBytes(StandardCharsets.UTF_8);
            writeRaw(h.serverOutputWriter(), "content-length: " + payload.length + "\r\n\r\n" + json);

            assertTrue(h.messageLatch().await(3, TimeUnit.SECONDS));
            assertEquals(json, h.received().getFirst());
        }
    }
}
