package edu.kit.quak.application.lsp.ports.in;

import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.core.lsp.model.LspLanguageId;

public interface LspSessionServicePort {
    String open(LspLanguageId language, LspClientConnectionPort clientConnection);
    void onClientMessage(String sessionId, String message);
    void onClientClosed(String sessionId);
}
