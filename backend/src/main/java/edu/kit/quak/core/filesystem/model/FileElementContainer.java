package edu.kit.quak.core.filesystem.model;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Domain POJO for FileElementContainer A FileElementContainer is a container that holds {@link
 * FileElement FileElements}.
 *
 * @author Henrik K
 */
public abstract class FileElementContainer<T extends FileElementContainer<T>>
        extends FileElement<T> {

    protected Set<FileElement<?>> contents = new HashSet<>();

    public FileElementContainer(String name, String parentId) {
        super(name, parentId);
    }

    protected FileElementContainer() {
        super();
    }

    public Set<FileElement<?>> getContents() {
        return Collections.unmodifiableSet(contents);
    }

    public void setContents(Set<FileElement<?>> contents) {
        this.contents = contents;
    }

    public void addChild(FileElement<?> child) {
        // No duplicate names within one parent
        if (hasChildWithName(child.getName())) {
            throw new IllegalArgumentException(
                    "An element with the name '"
                            + child.getName()
                            + "' already exists in '"
                            + this.getName()
                            + "'");
        }
        this.contents.add(child);

        child.setParentId(this.getId());
    }

    public void removeChild(FileElement<?> child) {
        this.contents.remove(child);
        // Delete aggregate reference
        if (child.getParentId() != null && child.getParentId().equals(this.getId())) {
            child.setParentId(null);
        }
    }

    // Case-insensitive
    private boolean hasChildWithName(String name) {
        return contents.stream()
                // Child will find itself make sure it is not added yet
                .anyMatch(existing -> existing.getName().equalsIgnoreCase(name));
    }
}
