package edu.kit.quak.infrastructure.config;

import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Hands out one numbered demo account per browser session: Testnutzer1, Testnutzer2, and so on.
 *
 * <p>Session-scoped rather than one shared account, so two people trying the app at the same time
 * do not edit each other's projects. A second tab in the same browser shares the session and stays
 * the same person; a different browser, device, or private window is someone new.
 *
 * <p>The numbering is deliberately naive -- a counter plus a lookup that skips names already taken.
 * It is not a reservation, so two sessions starting in the very same instant can both aim at the
 * same number; the loser simply takes the next one, because {@code register} re-checks under the
 * lock. Names are therefore stable and unique, but not necessarily handed out in arrival order.
 */
@Component
@Profile("demo")
@Slf4j
public class DemoGuestRegistry {

    /** Matches what {@code AuthenticationMapper} derives for non-OAuth authentication. */
    static final String ISSUER = "local";

    private final UserRepositoryPort userRepository;
    private final String namePrefix;
    private final AtomicInteger counter = new AtomicInteger(0);

    public DemoGuestRegistry(UserRepositoryPort userRepository, @Value("${app.demo.name-prefix:Testnutzer}") String namePrefix) {
        this.userRepository = userRepository;
        this.namePrefix = namePrefix;
    }

    /**
     * Returns the subject of a freshly created demo account.
     *
     * <p>Synchronised because the whole point is that two visitors never end up as the same person;
     * a demo has a handful of sessions, so the contention does not matter.
     */
    public synchronized String register() {
        while (true) {
            String subject = namePrefix + counter.incrementAndGet();
            if (userRepository.findByIssuerAndSub(ISSUER, subject).isPresent()) {
                continue; // Left over from an earlier run against the same database.
            }

            User guest = new User();
            guest.setIssuer(ISSUER);
            guest.setSub(subject);
            guest.setName(subject);
            guest.setEmail(subject.toLowerCase() + "@quak.local");
            guest.setEmailVerified(true);
            userRepository.save(guest);

            log.info("Created demo account {}", subject);
            return subject;
        }
    }
}
