package edu.kit.quak.core.domain.filesystem;

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
/**
 * Domain POJO for Project
 */
public class Project extends FileElementContainer<Project> {

    public static final String TYPE_IDENTIFIER = "project";
    public static final char ID_PREFIX = 'p';

    protected Project() { super(); }

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

    @Override
    public String getTypeIdentifier() {
        return TYPE_IDENTIFIER;
    }

    @Override
    public String generateId(Object base) {
        return ID_PREFIX + base.toString();
    }
}
