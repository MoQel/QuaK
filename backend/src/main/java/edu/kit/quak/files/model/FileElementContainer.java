package edu.kit.quak.files.model;

import java.util.Collection;

public interface FileElementContainer {
    boolean removeElement(FileElement<?> element);

    boolean addElement(FileElement<?> element);

    Collection<FileElement<?>> getContent();
}
