package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FileContentRequest(
        @NotNull byte[] content, @NotBlank String contentType) {}
