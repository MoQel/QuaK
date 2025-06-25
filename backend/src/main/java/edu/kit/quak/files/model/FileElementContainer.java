package edu.kit.quak.files.model;

import java.util.Collection;

/**
 * A FileElementContainer is a container that holds {@link FileElement FileElements}.
 *
 * @author Henrik K
 */
public interface FileElementContainer {

    /**
     * Removes the given element from this container
     * @param element The element to remove
     * @return {@code true} if this set contained the specified element
     */
    boolean removeElement(FileElement<?> element);

    /**
     * Adds the given {@code element} to this container
     * @param element The element to add
     * @return {@code true} if this set did not already contain the specified element
     */
    boolean addElement(FileElement<?> element);

    /**
     * @return The contained elements inside this container
     */
    Collection<FileElement<?>> getContent();
}
