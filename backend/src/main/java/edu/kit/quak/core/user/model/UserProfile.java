package edu.kit.quak.core.user.model;

/**
 * Profile data of a user as provided by the identity provider.
 *
 * @param email The user's email address
 * @param emailVerified Whether the identity provider has verified the email address
 * @param name The user's full name
 * @param givenName The user's given name
 * @param familyName The user's family name
 * @param avatarUrl The URL of the user's avatar
 */
public record UserProfile(String email, Boolean emailVerified, String name, String givenName, String familyName, String avatarUrl) {}
