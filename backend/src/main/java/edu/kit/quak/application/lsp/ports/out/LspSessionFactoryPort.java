package edu.kit.quak.application.lsp.ports.out;

public interface LspSessionFactoryPort {
    LspSessionPort create(String sessionId, LspClientConnectionPort connection);
}
