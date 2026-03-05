package edu.kit.quak.core.filesystem.model;

import edu.kit.quak.core.filesystem.exception.EmptyNameException;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Domain POJO for FileElement A FileElement is an element inside a {@link FileElementContainer
 * container} or the container itself. The idea behind this class is the concept of files and
 * directories as they are found inside a POSIX filesystem.
 *
 * @param <T> The definitionId used by the implementing classes in the method
 * @author Henrik K
 */
@Getter
@Setter
public abstract class FileElement<T extends FileElement<T>> {

    private String id;
    private String name;
    private Instant createdOn;
    private Instant lastAccess;
    private String parentId;

    // Frameworks only
    protected FileElement() {
        this.id = getIdPrefix() + "-" + UUID.randomUUID();
        this.createdOn = Instant.now();
        this.lastAccess = Instant.now();
    }

    public FileElement(String name, String parentId) {
        this.id = getIdPrefix() + "-" + UUID.randomUUID(); // ID generated in Domain (Best Practice)
        this.name = name;
        this.parentId = parentId;
        this.createdOn = Instant.now();
        this.lastAccess = Instant.now();
    }

    /**
     * Renames this element and updates the lastAccess timestamp. For business logic, prefer this
     * method over {@link #setName(String)}.
     *
     * @param newName the new name for this element
     * @throws EmptyNameException if the name is null or blank
     */
    public void rename(String newName) {
        if (newName == null || newName.isBlank()) {
            throw new EmptyNameException();
        }
        this.name = newName;
        this.lastAccess = Instant.now();
    }

    public void setLastAccessNow() {
        this.lastAccess = Instant.now();
    }

    public abstract String getTypeIdentifier();

    public abstract char getIdPrefix();

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FileElement<?> other)) return false;
        return id != null && id.equals(other.getId());
    }

    @Override
    public final int hashCode() {
        return getId() != null ? getId().hashCode() : 0;
    }
}
