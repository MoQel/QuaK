package edu.kit.quak.core.filesystem.model;

import java.util.Objects;
import java.util.Optional;

/**
 * Domain POJO for FileElement
 * A FileElement is an element inside a {@link FileElementContainer container} or the container itself.
 * The idea behind this class is the concept of files and directories as they are found inside a POSIX filesystem.
 *
 * @param <SELF> The type used by the implementing classes in the method {@link #patch(FileElement)}
 * @author Henrik K
 */
public abstract class FileElement<SELF extends FileElement<?>> {

    public static final String TYPE_FIELD = "type";
    private String id;
    private String name;
    private FileElementContainer<?> parent;

    protected FileElement() { }

    public FileElement(String name, FileElementContainer<?> parent) {
        this.name = name;
        this.parent = parent;
        addToParent();
    }

    private void addToParent() {
        if (parent != null) {
            parent.addElement(this);
        }
    }

    public void patch(SELF modified) throws IllegalArgumentException {
        if (modified.getName() != null) this.name = modified.getName();
    }

    //region getter and setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Optional<FileElementContainer<?>> getParent() {
        return Optional.ofNullable(parent);
    }
    public void setParent(FileElementContainer<?> parent) {
        this.parent = parent;
        addToParent();
    }

    public abstract String getTypeIdentifier();
    public abstract String generateId(Object base);
    public abstract char getIdPrefix();
    //endregion

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        FileElement<?> that = (FileElement<?>) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, parent);
    }
}