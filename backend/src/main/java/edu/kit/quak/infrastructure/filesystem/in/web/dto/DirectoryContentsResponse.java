package edu.kit.quak.infrastructure.filesystem.in.web.dto;

import java.util.List;

public record DirectoryContentsResponse(
        String id,
        String name,
        String type,
        List<FileElementDto> contents
) { }
