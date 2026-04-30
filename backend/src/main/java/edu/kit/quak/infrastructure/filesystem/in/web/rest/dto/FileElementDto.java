package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;
import lombok.Getter;

// Basis-DTO
@Getter
public abstract class FileElementDto {

    private final String id;
    private final String name;
    private final String type;
    private final Instant createdOn;
    private final Instant lastAccess;

    protected FileElementDto(String id, String name, String type, Instant createdOn, Instant lastAccess) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.createdOn = createdOn;
        this.lastAccess = lastAccess;
    }
}
