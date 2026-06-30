package edu.kit.quak.application.lsp.services;

import edu.kit.quak.application.lsp.exceptions.LspCapacityExceededException;
import edu.kit.quak.application.lsp.exceptions.LspCapacityExceededException.Limit;
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
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LspSessionService implements LspSessionServicePort {

    private final LspServerRegistryPort registry;
    private final LspSessionFactoryPort sessionFactory;
    private final int maxProcesses;
    private final int maxProcessesPerUser;
    private final Map<String, SessionRegistration> sessions = new ConcurrentHashMap<>();
    private final Map<String, Integer> activeProcessesByUser = new HashMap<>();
    private final Object capacityLock = new Object();
    private final AtomicBoolean acceptingSessions = new AtomicBoolean(true);
    private int activeProcesses;

    public LspSessionService(
        LspServerRegistryPort registry,
        LspSessionFactoryPort sessionFactory,
        int maxProcesses,
        int maxProcessesPerUser
    ) {
        this.registry = registry;
        this.sessionFactory = sessionFactory;
        this.maxProcesses = maxProcesses;
        this.maxProcessesPerUser = maxProcessesPerUser;
    }

    @Override
    public String open(String userId, LspLanguageId language, LspClientConnectionPort clientConnection) {
        if (!acceptingSessions.get()) {
            throw new LspCommunicationException("LSP service is shutting down");
        }

        LspServerDefinition definition = registry
            .findByLanguage(language)
            .orElseThrow(() -> new LspServerNotConfiguredException(language.value()));

        reserveCapacity(userId);

        LspSessionId sessionId = LspSessionId.newId();
        SessionRegistration registration = null;

        try {
            LspSessionPort session = sessionFactory.create(sessionId.value(), clientConnection, () ->
                onSessionTerminated(sessionId.value())
            );
            registration = new SessionRegistration(userId, session);
            sessions.put(sessionId.value(), registration);
            session.start(definition);
            log.info("Session {} opened for user={}.", sessionId.value(), userId);
            return sessionId.value();
        } catch (Exception primaryException) {
            if (registration != null) {
                sessions.remove(sessionId.value(), registration);
                closeSession(registration, sessionId.value(), primaryException);
                registration.releaseCapacity();
            } else {
                releaseCapacity(userId);
            }

            throw new LspCommunicationException("Failed to start LSP session for: " + definition.language().value(), primaryException);
        }
    }

    @Override
    public void onClientMessage(String sessionId, String message) {
        SessionRegistration registration = sessions.get(sessionId);
        if (registration == null || !registration.session().isOpen()) {
            throw new LspSessionNotFoundException(sessionId);
        }
        registration.session().sendToServer(message);
    }

    @Override
    public void onClientClosed(String sessionId) {
        SessionRegistration registration = sessions.remove(sessionId);
        if (registration == null) {
            return;
        }

        registration.releaseCapacity();
        closeSession(registration, sessionId, null);
    }

    @PreDestroy
    public void shutdown() {
        if (!acceptingSessions.compareAndSet(true, false)) {
            return;
        }

        sessions.forEach((sessionId, registration) -> {
            if (sessions.remove(sessionId, registration)) {
                registration.releaseCapacity();
                closeSession(registration, sessionId, null);
            }
        });
        log.info("Closed all LSP sessions during application shutdown.");
    }

    private void onSessionTerminated(String sessionId) {
        SessionRegistration registration = sessions.remove(sessionId);
        if (registration != null) {
            registration.releaseCapacity();
            log.info("Removed terminated LSP session={} from registry.", sessionId);
        }
    }

    private void reserveCapacity(String userId) {
        synchronized (capacityLock) {
            if (!acceptingSessions.get()) {
                throw new LspCommunicationException("LSP service is shutting down");
            }
            if (activeProcesses >= maxProcesses) {
                throw new LspCapacityExceededException(Limit.GLOBAL);
            }

            int userProcesses = activeProcessesByUser.getOrDefault(userId, 0);
            if (userProcesses >= maxProcessesPerUser) {
                throw new LspCapacityExceededException(Limit.USER);
            }

            activeProcesses++;
            activeProcessesByUser.put(userId, userProcesses + 1);
        }
    }

    private void releaseCapacity(String userId) {
        synchronized (capacityLock) {
            activeProcesses--;
            int remainingUserProcesses = activeProcessesByUser.getOrDefault(userId, 0) - 1;
            if (remainingUserProcesses <= 0) {
                activeProcessesByUser.remove(userId);
            } else {
                activeProcessesByUser.put(userId, remainingUserProcesses);
            }
        }
    }

    private void closeSession(SessionRegistration registration, String sessionId, Exception primaryException) {
        try {
            registration.session().close();
        } catch (IOException closeException) {
            if (primaryException != null) {
                primaryException.addSuppressed(closeException);
            } else {
                log.warn("Failed to close LSP session cleanly for sessionId={}", sessionId, closeException);
            }
        }
    }

    private final class SessionRegistration {

        private final String userId;
        private final LspSessionPort session;
        private final AtomicBoolean capacityReserved = new AtomicBoolean(true);

        private SessionRegistration(String userId, LspSessionPort session) {
            this.userId = userId;
            this.session = session;
        }

        private LspSessionPort session() {
            return session;
        }

        private void releaseCapacity() {
            if (capacityReserved.compareAndSet(true, false)) {
                LspSessionService.this.releaseCapacity(userId);
            }
        }
    }
}
