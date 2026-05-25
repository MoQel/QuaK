package edu.kit.quak.application.lsp.services;

import edu.kit.quak.application.lsp.exceptions.LspInfrastructureException;
import edu.kit.quak.application.lsp.exceptions.LspServerNotConfiguredException;
import edu.kit.quak.application.lsp.exceptions.LspSessionNotFoundException;
import edu.kit.quak.application.lsp.ports.in.LspSessionServicePort;
import edu.kit.quak.application.lsp.ports.out.LspClientConnectionPort;
import edu.kit.quak.application.lsp.ports.out.LspServerRegistryPort;
import edu.kit.quak.application.lsp.ports.out.LspSessionPort;
import edu.kit.quak.core.lsp.model.LspLanguage;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import edu.kit.quak.core.lsp.model.LspSessionId;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiFunction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LspSessionService implements LspSessionServicePort {

    private final LspServerRegistryPort registry;
    private final BiFunction<String, LspClientConnectionPort, LspSessionPort> sessionFactory;
    private final Map<String, LspSessionPort> sessions = new ConcurrentHashMap<>();

    public LspSessionService(LspServerRegistryPort registry, BiFunction<String, LspClientConnectionPort, LspSessionPort> sessionFactory) {
        this.registry = registry;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public String open(LspLanguage language, LspClientConnectionPort clientConnection) {
        LspServerDefinition definition = registry
            .findByLanguage(language)
            .orElseThrow(() -> new LspServerNotConfiguredException(language.id()));

        LspSessionId sessionId = LspSessionId.newId();
        LspSessionPort session = sessionFactory.apply(sessionId.value(), clientConnection);

        try {
            session.start(definition);
            sessions.put(sessionId.value(), session);
            log.info("Session {} opened.", sessionId.value());
            return sessionId.value();
        } catch (Exception primaryException) {
            // cleanup
            try {
                session.close();
            } catch (Exception secondaryException) {
                primaryException.addSuppressed(secondaryException);
            }

            throw new LspInfrastructureException("Failed to start LSP session for: " + definition.language().id(), primaryException);
        }
    }

    @Override
    public void onClientMessage(String sessionId, String message) {
        LspSessionPort session = sessions.get(sessionId);
        if (session == null || !session.isOpen()) {
            throw new LspSessionNotFoundException(sessionId);
        }
        try {
            session.sendToServer(message);
        } catch (Exception e) {
            throw new LspInfrastructureException("Failed to send message to server: " + sessionId, e);
        }
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
