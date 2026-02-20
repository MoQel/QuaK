package edu.kit.quak.application.library.ports.in;

import edu.kit.quak.core.library.model.OperationDefinition;
import java.util.List;

public interface OperationDefinitionServicePort {
    List<OperationDefinition> getAllOperationDefinitions();

    OperationDefinition getOperationDefinitionById(String id);
}
