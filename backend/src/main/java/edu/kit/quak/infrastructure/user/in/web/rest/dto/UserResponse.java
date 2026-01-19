package edu.kit.quak.infrastructure.user.in.web.rest.dto;

import java.util.UUID;

/** DTO for user response data. */
public record UserResponse(
        UUID userId, String email, String name, String avatarUrl, Boolean emailVerified) {}
