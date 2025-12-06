package edu.kit.quak.core.filesystem.model;

import jakarta.persistence.Entity;

/**
 * A Directory is a container of FileElements inside a project.
 *
 * @author Henrik K
 */
@Entity
public class Directory extends FileElementContainer<Directory> {

    public static final String TYPE_IDENTIFIER = "directory";
    public static final char ID_PREFIX = 'd';

    protected Directory() { }

    public Directory(String name, FileElementContainer<?> parent) {
        super(name, parent);
    }
    @Override
    public void patch(Directory modified) throws IllegalArgumentException {
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
