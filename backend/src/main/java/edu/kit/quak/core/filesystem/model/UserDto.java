package edu.kit.quak.core.filesystem.model;

import java.util.UUID;

public record UserDto(
    UUID userId,
    String email,
    String name,
    String avatarUrl,
    Boolean emailVerified
) {}
