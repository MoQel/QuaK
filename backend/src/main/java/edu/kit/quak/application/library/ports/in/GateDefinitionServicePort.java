package edu.kit.quak.application.library.ports.in;

import edu.kit.quak.core.library.model.GateDefinition;
import java.util.List;
import java.util.Optional;

public interface GateDefinitionServicePort {
    List<GateDefinition> getAllGateDefinitions();

    Optional<GateDefinition> getGateDefinitionById(String id);
}
