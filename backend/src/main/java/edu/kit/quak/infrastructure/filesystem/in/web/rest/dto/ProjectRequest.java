package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

import jakarta.validation.constraints.NotBlank;

public record ProjectRequest(@NotBlank(message = "Project name must not be blank") String name) {}
