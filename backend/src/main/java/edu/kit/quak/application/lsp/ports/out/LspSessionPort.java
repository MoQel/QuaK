package edu.kit.quak.application.lsp.ports.out;

import edu.kit.quak.core.lsp.model.LspServerDefinition;
import java.io.IOException;

public interface LspSessionPort {
    void start(LspServerDefinition definition) throws IOException;
    void sendToServer(String message);
    void close() throws IOException;
    boolean isOpen();
}
