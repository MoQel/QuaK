package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;

// Basis-DTO
public abstract class FileElementDto {
    private final String id;
    private final String name;
    private final String type;
    private final Instant createdOn;
    private final Instant lastAccess;

    public FileElementDto(
            String id, String name, String type, Instant createdOn, Instant lastAccess) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.createdOn = createdOn;
        this.lastAccess = lastAccess;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public Instant getCreatedOn() {
        return createdOn;
    }

    public Instant getLastAccess() {
        return lastAccess;
    }
}
