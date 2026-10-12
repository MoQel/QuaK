package edu.kit.quak.core.user.model;

import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Domain model representing a User. This is a pure POJO with no infrastructure dependencies. */
@Getter
@Setter
@NoArgsConstructor
public class User {

    public static final String GUEST_ISSUER = "guest";

    private UUID id;
    private String issuer;
    private String sub;
    private String email;
    private Boolean emailVerified;
    private String name;
    private String givenName;
    private String familyName;
    private String avatarUrl;
    private boolean guest;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
    private Instant lastActiveAt;

    public User(UUID id, String issuer, String sub) {
        this.id = id;
        this.issuer = issuer;
        this.sub = sub;
    }

    // Business Methods
    public void updateFromOidc(UserProfile profile) {
        this.email = profile.email();
        this.emailVerified = profile.emailVerified();
        this.name = profile.name();
        this.givenName = profile.givenName();
        this.familyName = profile.familyName();
        this.avatarUrl = profile.avatarUrl();
        this.lastLoginAt = Instant.now();
    }

    public static User createFromOidc(String issuer, String sub, UserProfile profile) {
        User user = new User();
        user.setIssuer(issuer);
        user.setSub(sub);
        user.updateFromOidc(profile);
        return user;
    }

    public static User createGuest() {
        User user = new User();
        user.setIssuer(GUEST_ISSUER);
        user.setSub(UUID.randomUUID().toString());
        user.setName("Guest");
        user.setGuest(true);
        user.setLastLoginAt(Instant.now());
        user.setLastActiveAt(user.getLastLoginAt());
        return user;
    }

    public void recordActivity() {
        this.lastActiveAt = Instant.now();
    }
}
