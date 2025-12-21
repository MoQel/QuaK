package edu.kit.quak.core.user.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model representing a User.
 * This is a pure POJO with no infrastructure dependencies.
 */
@Getter
@Setter
@NoArgsConstructor
public class User {
    private UUID id;
    private String issuer;
    private String sub;
    private String email;
    private Boolean emailVerified;
    private String name;
    private String givenName;
    private String familyName;
    private String avatarUrl;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;

    public User(UUID id, String issuer, String sub) {
        this.id = id;
        this.issuer = issuer;
        this.sub = sub;
    }

    // Business Methods
    public void updateFromOidc(String email, Boolean emailVerified, String name,
            String givenName, String familyName, String avatarUrl) {
        this.email = email;
        this.emailVerified = emailVerified;
        this.name = name;
        this.givenName = givenName;
        this.familyName = familyName;
        this.avatarUrl = avatarUrl;
        this.lastLoginAt = Instant.now();
    }

    public static User createFromOidc(String issuer, String sub, String email,
            Boolean emailVerified, String name,
            String givenName, String familyName,
            String avatarUrl) {
        User user = new User();
        user.setIssuer(issuer);
        user.setSub(sub);
        user.setEmail(email);
        user.setEmailVerified(emailVerified);
        user.setName(name);
        user.setGivenName(givenName);
        user.setFamilyName(familyName);
        user.setAvatarUrl(avatarUrl);
        user.setLastLoginAt(Instant.now());
        return user;
    }
}
