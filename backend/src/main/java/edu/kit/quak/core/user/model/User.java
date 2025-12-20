package edu.kit.quak.core.user.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model representing a User.
 * This is a pure POJO with no infrastructure dependencies.
 */
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

    // Constructors
    public User() {}

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

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getSub() {
        return sub;
    }

    public void setSub(String sub) {
        this.sub = sub;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGivenName() {
        return givenName;
    }

    public void setGivenName(String givenName) {
        this.givenName = givenName;
    }

    public String getFamilyName() {
        return familyName;
    }

    public void setFamilyName(String familyName) {
        this.familyName = familyName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
}
