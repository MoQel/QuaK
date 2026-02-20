package edu.kit.quak.infrastructure.config;

import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Automatically seeds the database with a development user when running with
 * the 'dev' profile.
 * This ensures that HTTP Basic Auth with the admin user works against the
 * database.
 */
@Configuration
@Profile("dev")
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepositoryPort userRepository;
    private final String devUsername;

    public DevDataSeeder(UserRepositoryPort userRepository, @Value("${app.dev.username:admin}") String devUsername) {
        this.userRepository = userRepository;
        this.devUsername = devUsername;
    }

    @Override
    public void run(String... args) {
        String issuer = "local";
        String subject = devUsername;

        if (userRepository.findByIssuerAndSub(issuer, subject).isEmpty()) {
            log.info("Seeding dev user: {}/{}", issuer, subject);
            User devUser = new User();
            devUser.setIssuer(issuer);
            devUser.setSub(subject);
            devUser.setName("Developer Admin");
            devUser.setEmail("admin@quak.local");
            devUser.setEmailVerified(true);

            userRepository.save(devUser);
            log.info("Dev user seeded successfully.");
        } else {
            log.debug("Dev user already exists, skipping seeding.");
        }
    }
}
