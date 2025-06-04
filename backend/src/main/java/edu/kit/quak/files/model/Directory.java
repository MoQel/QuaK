package edu.kit.quak.files.model;

import com.google.gson.JsonElement;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import static edu.kit.quak.files.model.Type.DIRECTORY;

@Entity
public class Directory extends FileElement {
    @OneToMany(mappedBy = "id")
    private Set<FileElement> contents;

    public boolean removeElement(FileElement element) {
        return contents.remove(element);
    }

    public boolean addElement(FileElement element) {
        return contents.add(element);
    }

    public Collection<FileElement> getContent() {
        return new HashSet<>(contents);
    }

    @Override
    public JsonElement toJson() {
        return null;
    }

    @Override
    public Type getType() {
        return DIRECTORY;
    }
}
