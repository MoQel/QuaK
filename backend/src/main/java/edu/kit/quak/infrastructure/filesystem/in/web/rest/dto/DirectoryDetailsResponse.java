package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import java.time.Instant;

public class DirectoryDetailsResponse extends FileElementDto {

    public DirectoryDetailsResponse(String id, String name, String type, Instant createdOn, Instant lastAccess) {
        super(id, name, type, createdOn, lastAccess);
    }
}
