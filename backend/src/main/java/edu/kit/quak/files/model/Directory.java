package edu.kit.quak.files.model;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import static edu.kit.quak.files.model.Type.DIRECTORY;

@Entity
public class Directory extends FileElement implements FileElementContainer {

    @OneToMany
    private Set<FileElement> contents = new HashSet<>();

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
    public Type getType() {
        return DIRECTORY;
    }
}
