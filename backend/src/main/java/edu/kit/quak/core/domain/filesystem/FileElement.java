package edu.kit.quak.core.domain.filesystem;

import java.util.Objects;
import java.util.Optional;

/**
 * A FileElement is an element inside a {@link FileElementContainer container} or the container itself.
 * The idea behind this class is the concept of files and directories as they are found inside a POSIX filesystem.
 *
 * @param <SELF> The type used by the implementing classes in the method {@link #patch(FileElement)}
 * @author Henrik K
 */
/**
 * Domain POJO for FileElement
 */
public abstract class FileElement<SELF extends FileElement<?>> {

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
        if (modified == null) return;
        if (modified.getName() != null) this.name = modified.getName();
    }

    public abstract String getTypeIdentifier();
    public abstract String generateId(Object base);

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