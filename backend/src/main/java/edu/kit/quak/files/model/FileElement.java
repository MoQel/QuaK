package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;
import edu.kit.quak.Savable;
import edu.kit.quak.files.configuration.CustomIdGenerator;
import edu.kit.quak.files.configuration.FileElementResolver;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.util.Objects;

/**
 * A FileElement is an element inside a {@link FileElementContainer container} or the container itself.
 * The idea behind this class is the concept of files and directories as they are found inside a POSIX filesystem.
 *
 * @param <SELF> The type used by the implementing classes in the method {@link #patch(FileElement)}
 * @author Henrik K
 */
@Entity
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = FileElement.TYPE_FIELD
)
@JsonTypeIdResolver(FileElementResolver.class)
public abstract class FileElement<SELF extends FileElement<?>> implements Savable {

    public static final String TYPE_FIELD = "type";

    @JsonProperty
    @Id
    @CustomIdGenerator.FileElementId
    private String id;

    @JsonProperty
    private String name;

    public abstract Type getType();

    /**
     * Similar to the HTTP's PATCH-method, this method allows for changing predefined
     * values of this object to the values of a modified object.
     * @param modified The object that holds the information to be changed
     * @throws IllegalArgumentException If the patch has a set (not null) property that
     * differs from this object and that is considered to be non-changeable.
     */
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
