package edu.kit.quak.infrastructure.user.in.scheduler;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Periodically deletes guest accounts that have been inactive for longer than {@code app.guest.max-inactivity}. */
@Component
@EnableScheduling
@ConditionalOnProperty(name = "app.guest.enabled", havingValue = "true")
public class GuestCleanupScheduler {

    private final GuestServicePort guestService;
    private final Duration maxInactivity;

    public GuestCleanupScheduler(GuestServicePort guestService, @Value("${app.guest.max-inactivity}") Duration maxInactivity) {
        this.guestService = guestService;
        this.maxInactivity = maxInactivity;
    }

    @Scheduled(fixedDelayString = "${app.guest.cleanup-interval}")
    public void deleteInactiveGuests() {
        guestService.deleteInactiveGuests(Instant.now().minus(maxInactivity));
    }
}
