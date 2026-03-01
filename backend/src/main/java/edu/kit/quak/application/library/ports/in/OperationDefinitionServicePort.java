package edu.kit.quak.application.library.ports.in;

import edu.kit.quak.core.library.model.OperationDefinition;
import java.util.List;
import java.util.Optional;

public interface OperationDefinitionServicePort {
    List<OperationDefinition> getAllOperationDefinitions();

    Optional<OperationDefinition> getOperationDefinitionById(String id);
}
