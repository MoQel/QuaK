package edu.kit.quak.infrastructure.filesystem.in.web.dto;

import jakarta.validation.constraints.Size;

public record RenameFileRequest(
        @Size(min = 1, message = "Name must not be empty.")
        String name
) {}