package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;

public class FileDetailsResponse extends FileElementDto {

    private final String contentType;

    public FileDetailsResponse(
            String id,
            String name,
            String type,
            String contentType,
            Instant createdOn,
            Instant lastAccess) {
        super(id, name, type, createdOn, lastAccess);
        this.contentType = contentType;
    }

    public String getContentType() {
        return contentType;
    }
}
