package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

// Basis-DTO (Port)
public sealed interface FileElementDto permits DirectoryDetailsResponse, FileDetailsResponse {
    String id();
    String name();
    String type();
}
