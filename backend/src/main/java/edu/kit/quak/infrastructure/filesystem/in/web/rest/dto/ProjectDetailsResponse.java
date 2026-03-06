package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import java.time.Instant;

public record ProjectDetailsResponse(String id, String name, String type, Instant createdOn, Instant lastAccess, UserResponse owner) {}
