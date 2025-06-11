package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import edu.kit.quak.files.configuration.DepthFilter;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import static edu.kit.quak.files.model.Type.PROJECT;

/**
 * A project is a top level container of {@link FileElement}.
 *
 * @implNote Projects are in their core similar to a directory.
 * They are implemented in an own class to allow for different functionalities
 * later in development.
 * @author Henrik K
 */
@Entity
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NONE
)
public class Project extends FileElement<Project> implements FileElementContainer {

    @OneToMany
    @JsonProperty("contents")
    @JsonFilter(DepthFilter.FILTER_NAME)
    private Set<FileElement<?>> content = new HashSet<>();

    //We don't need a json-type info here since projects get posted
    //to a dedicated endpoint
    @JsonIgnore
    @Override
    public Type getType() {
        return PROJECT;
    }

    protected Project() { }

    public Project(String name) {
        super(name);
    }

    @Override
    public void patch(Project modified) throws IllegalArgumentException {
        if (modified.content == null || content.containsAll(modified.content) && modified.content.containsAll(content)) {
            super.patch(modified);
        } else {
            throw new IllegalArgumentException("Cant patch contents. Use the appropriate method");
        }
    }

    @Override
    public boolean removeElement(FileElement<?> element) {
        return content.remove(element);
    }

    @Override
    public boolean addElement(FileElement<?> element) {
        return content.add(element);
    }

    @Override
    @JsonIgnore
    public Collection<FileElement<?>> getContent() {
        return new HashSet<>(content);
    }
}
