package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import edu.kit.quak.files.configuration.DepthFilter;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * A FileElementContainer is a container that holds {@link FileElement FileElements}.
 *
 * @author Henrik K
 */
@Entity
public abstract class FileElementContainer<SELF extends FileElementContainer<SELF>> extends FileElement<SELF> {

    @JsonIgnore
    @OneToMany(orphanRemoval = true, cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    protected Set<FileElement<?>> contents = new HashSet<>();

    public FileElementContainer(String name, FileElementContainer<?> parent) {
        super(name, parent);
    }

    protected FileElementContainer() {
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

    @JsonSetter("contents")
    public boolean addElements(Collection<FileElement<?>> elements) {
        return contents.addAll(elements);
    }

    /**
     * @return The contained elements inside this container
     */
    @JsonGetter("contents")
    @JsonFilter(DepthFilter.FILTER_NAME)
    public Collection<FileElement<?>> getElements() {
        return new HashSet<>(contents);
    };
}
