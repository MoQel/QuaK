package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

public record FileContentRequest(
        byte[] content,
        String contentType
) {}
