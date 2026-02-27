package edu.kit.quak.application.library.ports.out;

import edu.kit.quak.core.library.model.OperationDefinition;
import java.util.List;
import java.util.Optional;

public interface OperationDefinitionRepositoryPort {
    List<OperationDefinition> findAllOperationDefinitions();

    Optional<OperationDefinition> findOperationDefinitionById(String id);
}
