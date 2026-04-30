package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;

public class FileDetailsResponse extends FileElementDto {

    public FileDetailsResponse(String id, String name, String type, Instant createdOn, Instant lastAccess) {
        super(id, name, type, createdOn, lastAccess);
    }
}
