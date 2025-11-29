package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.Entity;

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
public class Project extends FileElementContainer<Project> {

    public static final String TYPE_IDENTIFIER = "project";
    public static final char ID_PREFIX = 'p';

    protected Project() { }

    public Project(String name) {
        super(name, null);
    }

    @Override
    public void patch(Project modified) throws IllegalArgumentException {
        if (modified.contents == null || modified.contents.isEmpty() || contents.containsAll(modified.contents) && modified.contents.containsAll(contents)) {
            super.patch(modified);
        } else {
            throw new IllegalArgumentException("Cant patch contents. Use the appropriate method");
        }
    }

    //We don't need a json-type info here since projects get posted
    //to a dedicated endpoint
    @Override
    @JsonIgnore
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    @Override
    public String generateId(Object base) {
        return ID_PREFIX + base.toString();
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    @jakarta.persistence.ManyToOne
    private edu.kit.quak.security.model.User owner;

    public edu.kit.quak.security.model.User getOwner() {
        return owner;
    }

    public void setOwner(edu.kit.quak.security.model.User owner) {
        this.owner = owner;
    }
}
