package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import static edu.kit.quak.files.model.Type.PROJECT;

@Entity
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NONE
)
public class Project extends FileElement<Project> implements FileElementContainer {

    @OneToMany
    @JsonProperty("contents")
    private Set<FileElement<?>> content = new HashSet<>();

    @Override
    public Type getType() {
        return PROJECT;
    }

    @Override
    public void patch(Project modified) throws IllegalArgumentException {
        if (modified.content == null || content.containsAll(modified.content) && modified.content.containsAll(content)) {
            super.patch(modified);
        } else {
            throw new IllegalArgumentException("Cant patch contents. Use the appropriate method");
        }
    }

    @Override
    public boolean removeElement(FileElement<?> element) {
        return content.remove(element);
    }

    @Override
    public boolean addElement(FileElement<?> element) {
        return content.add(element);
    }

    @Override
    @JsonIgnore
    public Collection<FileElement<?>> getContent() {
        return new HashSet<>(content);
    }
}
