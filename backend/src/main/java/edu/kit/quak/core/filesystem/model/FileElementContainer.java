package edu.kit.quak.core.filesystem.model;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * Domain POJO for FileElementContainer
 * A FileElementContainer is a container that holds {@link FileElement FileElements}.
 *
 * @author Henrik K
 */
public abstract class FileElementContainer<SELF extends FileElementContainer<SELF>> extends FileElement<SELF> {

    protected Set<FileElement<?>> contents = new HashSet<>();

    public FileElementContainer(String name, FileElementContainer<?> parent) {
        super(name, parent);
    }

    protected FileElementContainer() {
        super();
    }

    /**
     * Removes the given element from this container
     * @param element The element to remove
     */
    public void removeElement(FileElement<?> element) {
        element.setParent(null);
        contents.remove(element);
    }

    /**
     * Adds the given {@code element} to this container
     * @param element The element to add
     */
    public void addElement(FileElement<?> element) {
        contents.add(element);
    }

    public Set<FileElement<?>> getContents() {
        return contents;
    }

    /**
     * @return A defensive copy of the contained elements inside this container
     */
    public Set<FileElement<?>> getElements() {
        return Set.copyOf(contents);
    }
}