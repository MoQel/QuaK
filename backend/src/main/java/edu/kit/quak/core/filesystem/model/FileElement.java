package edu.kit.quak.core.filesystem.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain POJO for FileElement
 * A FileElement is an element inside a {@link FileElementContainer container} or the container itself.
 * The idea behind this class is the concept of files and directories as they are found inside a POSIX filesystem.
 *
 * @param <T> The definitionId used by the implementing classes in the method
 * @author Henrik K
 */
public abstract class FileElement<T extends FileElement<T>> {

    private String id;
    private String name;
    private Instant createdOn;
    private Instant lastAccess;
    private String parentId;

    // Frameworks only
    protected FileElement() { }

    public FileElement(String name, String parentId) {
        this.id = getIdPrefix() + "-" + UUID.randomUUID(); // ID generated in Domain (Best Practice)
        this.name = name;
        this.parentId = parentId;
        this.createdOn = Instant.now();
        this.lastAccess = Instant.now();
    }

    //region getter and setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void rename(String newName) {
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        this.name = newName;
        this.lastAccess = Instant.now();
    }

    public String getParentId() {
        return parentId;
    }
    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    protected void setCreatedOn(Instant createdOn) { this.createdOn = createdOn; }
    public Instant getCreatedOn() {
        return createdOn;
    }

    public Instant getLastAccess() {
        return lastAccess;
    }
    public void setLastAccess(Instant lastAccess) { this.lastAccess = lastAccess; }
    public void setLastAccessNow() {
        this.lastAccess = Instant.now();
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