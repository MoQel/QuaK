package edu.kit.quak.application.library.ports.out;

import edu.kit.quak.core.library.model.GateDefinition;
import java.util.List;
import java.util.Optional;

public interface GateDefinitionRepositoryPort {
    List<GateDefinition> findAllGateDefinitions();

    Optional<GateDefinition> findGateDefinitionById(String id);
}
