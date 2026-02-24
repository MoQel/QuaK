package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateFileRequest(
    @NotBlank(message = "Filename must not be blank") String name,

    @NotNull(message = "Content-Type must be specified")
    @Pattern(regexp = "^[a-z]+/[-a-z0-9]+$", message = "Invalid Content-Type format")
    String contentType
) {}
