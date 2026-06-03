package edu.kit.quak.application.lsp.services;

import edu.kit.quak.application.lsp.exceptions.LspCommunicationException;
import edu.kit.quak.application.lsp.exceptions.LspServerNotConfiguredException;
import edu.kit.quak.application.lsp.exceptions.LspSessionNotFoundException;
import edu.kit.quak.application.lsp.ports.in.LspSessionServicePort;
import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.application.lsp.ports.out.LspServerRegistryPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionFactoryPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionPort;
import edu.kit.quak.core.lsp.model.LspLanguageId;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import edu.kit.quak.core.lsp.model.LspSessionId;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LspSessionService implements LspSessionServicePort {

    private final LspServerRegistryPort registry;
    private final LspSessionFactoryPort sessionFactory;
    private final Map<String, LspSessionPort> sessions = new ConcurrentHashMap<>();

    public LspSessionService(LspServerRegistryPort registry, LspSessionFactoryPort sessionFactory) {
        this.registry = registry;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public String open(LspLanguageId language, LspClientConnectionPort clientConnection) {
        LspServerDefinition definition = registry
            .findByLanguage(language)
            .orElseThrow(() -> new LspServerNotConfiguredException(language.value()));

        LspSessionId sessionId = LspSessionId.newId();
        LspSessionPort session = sessionFactory.create(sessionId.value(), clientConnection);

        try {
            session.start(definition);
            sessions.put(sessionId.value(), session);
            log.info("Session {} opened.", sessionId.value());
            return sessionId.value();
        } catch (Exception primaryException) {
            // always run cleanup
            // Catches Exception (not just IOException) intentionally: cleanup must run regardless
            // of exception type. Mirrors the try-with-resources pattern — if close() also fails,
            // the secondary exception is attached via addSuppressed to preserve the root cause.
            try {
                session.close();
            } catch (Exception secondaryException) {
                primaryException.addSuppressed(secondaryException);
            }

            throw new LspCommunicationException("Failed to start LSP session for: " + definition.language().value(), primaryException);
        }
    }

    @Override
    public void onClientMessage(String sessionId, String message) {
        LspSessionPort session = sessions.get(sessionId);
        if (session == null || !session.isOpen()) {
            throw new LspSessionNotFoundException(sessionId);
        }
        session.sendToServer(message);
    }

    @Override
    public void onClientClosed(String sessionId) {
        LspSessionPort session = sessions.remove(sessionId);
        if (session != null) {
            try {
                session.close();
            } catch (IOException e) {
                // Client already disconnected, just log the cleanup failure
                log.warn("Failed to close LSP session cleanly for sessionId={}", sessionId, e);
            }
        }
    }
}
