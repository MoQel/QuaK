package edu.kit.quak.core.filesystem.model;

import java.util.Optional;

/**
 * Domain POJO for FileElement
 * A FileElement is an element inside a {@link FileElementContainer container} or the container itself.
 * The idea behind this class is the concept of files and directories as they are found inside a POSIX filesystem.
 *
 * @param <SELF> The type used by the implementing classes in the method
 * @author Henrik K
 */
public abstract class FileElement<SELF extends FileElement<?>> {

    public static final String TYPE_FIELD = "fileElement";
    private String id;
    private String name;
    private FileElementContainer<?> parent;

    protected FileElement() { }

    public FileElement(String name, FileElementContainer<?> parent) {
        this.name = name;
        addToParent(parent);
    }

    //region getter and setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    protected void setName(String name) { this.name = name; }
    public void rename(String name) { this.name = name; }

    public Optional<FileElementContainer<?>> getParent() {
        return Optional.ofNullable(parent);
    }

    public String getParentId() {
        return getParent().map(FileElementContainer::getId).orElse(null);
    }

    public void addToParent(FileElementContainer<?> newParent) {
        if (newParent == this) {
            throw new IllegalArgumentException("An element cannot be its own parent");
        }
        if (this.parent != null && newParent != this.parent) {
            this.parent.contents.remove(this);
        }
        if (newParent != null &&
                newParent.getContents().stream().filter(existing -> existing != this)
                .anyMatch(existing -> existing.getName().equals(this.getName()))) {
            throw new IllegalArgumentException(
                    "An element with the name '" + this.getName() + "' already exists in '" + newParent.getName() + "'"
            );
        }
        this.parent = newParent;
        if (this.parent != null) {
            this.parent.addElement(this);
        }
    }

    public abstract String getTypeIdentifier();
    public abstract char getIdPrefix();
    //endregion

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FileElement<?> other)) return false;

        return id != null && id.equals(other.getId());
    }

    @Override
    public final int hashCode() {
        return FileElement.class.hashCode();
    }
}