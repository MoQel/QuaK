package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;

public record FileDetailsResponse(
    String id,
    String name,
    String type,
    String contentType,
    Instant createdOn,
    Instant lastAccess
) implements FileElementDto {}
