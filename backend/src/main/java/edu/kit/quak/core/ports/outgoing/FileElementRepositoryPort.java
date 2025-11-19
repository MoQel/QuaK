package edu.kit.quak.core.ports.outgoing;

import edu.kit.quak.core.domain.filesystem.FileElement;

import java.util.Optional;

public interface FileElementRepositoryPort<T extends FileElement<?>> {

    Optional<T> findById(String id);

    T save(T element);

    boolean existsById(String id);

    Optional<T> findByIdForDeletion(String id);
}
