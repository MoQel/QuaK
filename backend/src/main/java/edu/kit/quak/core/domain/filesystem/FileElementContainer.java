package edu.kit.quak.core.domain.filesystem;

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
     * @return {@code true} if this set contained the specified element
     */
    public boolean removeElement(FileElement<?> element) {
        return contents.remove(element);
    }

    /**
     * Adds the given {@code element} to this container
     * @param element The element to add
     * @return {@code true} if this set did not already contain the specified element
     */
    public boolean addElement(FileElement<?> element) {
        return contents.add(element);
    }

    public boolean addElements(Collection<FileElement<?>> elements) {
        return contents.addAll(elements);
    }

    /**
     * @return A defensive copy of the contained elements inside this container
     */
    public Set<FileElement<?>> getElements() {
        return Set.copyOf(contents);
    };
}