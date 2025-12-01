package edu.kit.quak.infrastructure.filesystem.in.web.dto;

public record FileContentDto(
        byte[] content,
        String contentType
) {}
