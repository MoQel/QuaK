package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

public record FileContentDto(
        byte[] content,
        String contentType
) {}
