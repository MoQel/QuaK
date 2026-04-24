package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFileRequest(@NotBlank(message = "Filename must not be blank") String name) {}
