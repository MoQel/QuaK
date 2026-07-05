package edu.kit.quak.application.lsp.ports.out;

import java.io.IOException;

public interface LspClientConnectionPort {
    void sendToClient(String message) throws IOException;
    void close(int code, String reason) throws IOException;
    boolean isOpen();
}
