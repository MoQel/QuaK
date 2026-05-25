package edu.kit.quak.application.lsp.ports.in;

import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.core.lsp.model.LspLanguage;

public interface LspSessionServicePort {
    String open(LspLanguage language, LspClientConnectionPort clientConnection);
    void onClientMessage(String sessionId, String message);
    void onClientClosed(String sessionId);
}
