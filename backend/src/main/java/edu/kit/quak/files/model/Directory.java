package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import edu.kit.quak.files.configuration.DepthFilter;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import static edu.kit.quak.files.model.Type.DIRECTORY;

/**
 * A Directory is a container of FileElements inside a project.
 *
 * @author Henrik K
 */
@Entity
public class Directory extends FileElement<Directory> implements FileElementContainer {

    protected Directory() { }

    public Directory(String name) {
        super(name);
    }

    @OneToMany
    @JsonProperty("contents")
    @JsonFilter(DepthFilter.FILTER_NAME)
    private Set<FileElement<?>> contents = new HashSet<>();

    public boolean removeElement(FileElement<?> element) {
        return contents.remove(element);
    }

    public boolean addElement(FileElement<?> element) {
        return contents.add(element);
    }

    @JsonIgnore
    public Collection<FileElement<?>> getContent() {
        return new HashSet<>(contents);
    }

    @Override
    public void patch(Directory modified) throws IllegalArgumentException {
        if (modified.contents == null || contents.containsAll(modified.contents) && modified.contents.containsAll(contents)) {
            super.patch(modified);
        } else {
            throw new IllegalArgumentException("Cant patch contents. Use the appropriate method");
        }
    }

    @Override
    public Type getType() {
        return DIRECTORY;
    }
}
