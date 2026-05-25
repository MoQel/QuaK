package edu.kit.quak.infrastructure.lsp.out.process;

import edu.kit.quak.application.lsp.exceptions.LspInfrastructureException;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class StdioJsonRpcBridge {

    private final InputStream serverStdout;
    private final OutputStream serverStdin;
    private final Consumer<String> onServerMessage;
    private final Runnable onServerClosed;
    private final ExecutorService readerExecutor = Executors.newSingleThreadExecutor();

    public StdioJsonRpcBridge(
        InputStream serverStdout,
        OutputStream serverStdin,
        Consumer<String> onServerMessage,
        Runnable onServerClosed
    ) {
        this.serverStdout = new BufferedInputStream(serverStdout);
        this.serverStdin = new BufferedOutputStream(serverStdin);
        this.onServerMessage = onServerMessage;
        this.onServerClosed = onServerClosed;
    }

    public void start() {
        readerExecutor.submit(this::readLoop);
    }

    public synchronized void send(String json) {
        try {
            byte[] payload = json.getBytes(StandardCharsets.UTF_8);
            String header = "Content-Length: " + payload.length + "\r\n\r\n";
            serverStdin.write(header.getBytes(StandardCharsets.US_ASCII));
            serverStdin.write(payload);
            serverStdin.flush();
        } catch (IOException e) {
            throw new LspInfrastructureException("Failed to write JSON-RPC message to LSP server stdin", e);
        }
    }

    public void close() {
        readerExecutor.shutdownNow();
        try {
            serverStdout.close();
        } catch (IOException e) {
            log.warn("Failed to close LSP server stdout cleanly", e);
        }

        try {
            serverStdin.close();
        } catch (IOException e) {
            log.warn("Failed to close LSP server stdin cleanly", e);
        }
    }

    private void readLoop() {
        try {
            boolean keepReading = true;
            while (keepReading && !Thread.currentThread().isInterrupted()) {
                keepReading = readAndDispatch();
            }
        } catch (IOException e) {
            log.debug("LSP server stream closed or read interrupted", e);
        } catch (Exception e) {
            log.error("Unexpected error in LSP read loop", e);
        } finally {
            onServerClosed.run();
        }
    }

    private int readHeaders(InputStream inputStream) throws IOException {
        ByteArrayOutputStream headerBuffer = new ByteArrayOutputStream();

        int matched = 0;
        byte[] delimiter = "\r\n\r\n".getBytes(StandardCharsets.US_ASCII);

        while (true) {
            int b = inputStream.read();
            if (b == -1) {
                return -1;
            }

            headerBuffer.write(b);

            if (b == delimiter[matched]) {
                matched++;
                if (matched == delimiter.length) {
                    break;
                }
            } else {
                matched = b == delimiter[0] ? 1 : 0;
            }
        }

        String headers = headerBuffer.toString(StandardCharsets.US_ASCII);
        return parseContentLength(headers);
    }

    private boolean readAndDispatch() throws IOException {
        int contentLength = readHeaders(serverStdout);

        if (contentLength <= 0) {
            return false;
        }

        byte[] payload = serverStdout.readNBytes(contentLength);

        if (payload.length != contentLength) {
            return false;
        }

        onServerMessage.accept(new String(payload, StandardCharsets.UTF_8));
        return true;
    }

    private int parseContentLength(String headers) {
        String[] lines = headers.split("\r\n");

        for (String line : lines) {
            String lower = line.toLowerCase(Locale.ROOT);
            if (lower.startsWith("content-length:")) {
                String value = line.substring("content-length:".length()).trim();
                try {
                    return Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    throw new LspInfrastructureException("Invalid Content-Length format received from LSP server: " + value, e);
                }
            }
        }

        throw new LspInfrastructureException("Missing Content-Length header in LSP response. Received headers: " + headers, null);
    }
}
