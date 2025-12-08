package edu.kit.quak.infrastructure.filesystem.in.web.rest.dto;

// Basis-DTO
public abstract class FileElementDto {
    private final String id;
    private final String name;
    private final String type;

    public FileElementDto(String id, String name, String type) {
        this.id = id;
        this.name = name;
        this.type = type;
    }

    public String getId() {
        return id;
    }
    public String getName() {
        return name;
    }
    public String getType() {
        return type;
    }
}
