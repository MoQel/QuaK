package edu.kit.quak.infrastructure.filesystem.in.web.dto;

public record DirectoryDetailsResponse(
        String id,
        String name,
        String type
) implements FileElementDto { }
