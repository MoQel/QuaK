package edu.kit.quak.application.user.ports.in;

/** DTO for OIDC user information to decouple the application layer from Spring Security. */
public record OidcUserInfo(
    String sub,
    String email,
    Boolean emailVerified,
    String fullName,
    String givenName,
    String familyName,
    String picture
) {}
