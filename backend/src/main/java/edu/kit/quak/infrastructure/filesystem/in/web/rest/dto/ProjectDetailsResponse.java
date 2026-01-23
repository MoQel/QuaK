package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;

public record ProjectDetailsResponse(
        String id, String name, String type, Instant createdOn, Instant lastAccess) {}
