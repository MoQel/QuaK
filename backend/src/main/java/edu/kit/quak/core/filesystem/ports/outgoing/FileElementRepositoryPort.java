package edu.kit.quak.core.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.domain.FileElement;

import java.util.Optional;

public interface FileElementRepositoryPort<T extends FileElement<?>> {

    Optional<T> findById(String id);

    T save(T element);

    boolean existsById(String id);

    void deleteById(String id);

    Class<T> getHandledClass();
    String getHandledTypeIdentifier();
}
