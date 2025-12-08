package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;

public class FileDetailsResponse extends FileElementDto {

    private final String contentType;
    private final Instant createdOn;
    private final Instant lastAccess;

    public FileDetailsResponse(String id, String name, String type, String contentType, Instant createdOn, Instant lastAccess) {
        super(id, name, type);
        this.contentType = contentType;
        this.createdOn = createdOn;
        this.lastAccess = lastAccess;
    }

    public String getContentType() {
        return contentType;
    }
    public Instant getCreatedOn() {
        return createdOn;
    }
    public Instant getLastAccess() {
        return lastAccess;
    }
}
