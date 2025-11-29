package edu.kit.quak.security.model;

import java.util.UUID;

public record UserDto(
    UUID userId,
    String email,
    String name,
    String avatarUrl,
    Boolean emailVerified
) {}
