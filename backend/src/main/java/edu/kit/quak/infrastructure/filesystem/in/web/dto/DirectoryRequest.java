package edu.kit.quak.infrastructure.filesystem.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record DirectoryRequest(
        @NotBlank(message = "Directory name must not be blank")
        String name
) {
}
