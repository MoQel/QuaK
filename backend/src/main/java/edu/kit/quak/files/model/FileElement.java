package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.gson.JsonElement;
import edu.kit.quak.Savable;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.util.Objects;

@Entity
public abstract class FileElement implements Savable {
    @JsonProperty
    @Id
    @CustomIdGenerator.FileElementId
    private String id;

    @JsonProperty
    private String name;

    public abstract Type getType();

    public abstract JsonElement toJson();

    /// Constructor used by the persistence implementation
    protected FileElement() { }

    public FileElement(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    @Override
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        FileElement element = (FileElement) o;
        return Objects.equals(id, element.id) && Objects.equals(name, element.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
}
