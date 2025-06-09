package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;
import edu.kit.quak.Savable;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.util.Objects;

@Entity
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonTypeIdResolver(FileElementResolver.class)
public abstract class FileElement<SELF extends FileElement<?>> implements Savable {
    @JsonProperty
    @Id
    @CustomIdGenerator.FileElementId
    private String id;

    @JsonProperty
    private String name;

    @JsonIgnore
    public abstract Type getType();

    public void patch(SELF modified) throws IllegalArgumentException {
        if (modified.getName() != null)
            this.name = modified.getName();
    }

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
        FileElement<?> element = (FileElement<?>) o;
        return Objects.equals(id, element.id) && Objects.equals(name, element.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
}
