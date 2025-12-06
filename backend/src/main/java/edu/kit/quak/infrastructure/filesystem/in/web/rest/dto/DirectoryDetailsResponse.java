package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

public record DirectoryDetailsResponse(
        String id,
        String name,
        String type
) implements FileElementDto { }
