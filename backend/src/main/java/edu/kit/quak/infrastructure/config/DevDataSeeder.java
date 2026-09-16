package edu.kit.quak.infrastructure.config;

import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Seeds the database with the trusted local user used by the {@code dev} and {@code local}
 * profiles. In development this backs HTTP Basic authentication; in local mode requests are
 * automatically authenticated as the same user.
 */
@Configuration
@Profile({ "dev", "local" })
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepositoryPort userRepository;
    private final String localUsername;

    public DevDataSeeder(
        UserRepositoryPort userRepository,
        @Value("${app.local.username:${app.dev.username:admin}}") String localUsername
    ) {
        this.userRepository = userRepository;
        this.localUsername = localUsername;
    }

    @Override
    public void run(String... args) {
        String issuer = "local";
        String subject = localUsername;

        if (userRepository.findByIssuerAndSub(issuer, subject).isEmpty()) {
            log.info("Seeding trusted local user: {}/{}", issuer, subject);
            User devUser = new User();
            devUser.setIssuer(issuer);
            devUser.setSub(subject);
            devUser.setName("Developer Admin");
            devUser.setEmail("admin@quak.local");
            devUser.setEmailVerified(true);

            userRepository.save(devUser);
            log.info("Trusted local user seeded successfully.");
        } else {
            log.debug("Trusted local user already exists, skipping seeding.");
        }
    }
}
