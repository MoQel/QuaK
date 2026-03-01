package edu.kit.quak.application.library.services;

import edu.kit.quak.application.library.ports.in.OperationDefinitionServicePort;
import edu.kit.quak.application.library.ports.out.OperationDefinitionRepositoryPort;
import edu.kit.quak.core.library.model.OperationDefinition;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class OperationDefinitionService implements OperationDefinitionServicePort {

    private final OperationDefinitionRepositoryPort operationRepository;

    public OperationDefinitionService(OperationDefinitionRepositoryPort operationRepository) {
        this.operationRepository = operationRepository;
    }

    @Override
    public List<OperationDefinition> getAllOperationDefinitions() {
        return operationRepository.findAllOperationDefinitions();
    }

    @Override
    public Optional<OperationDefinition> getOperationDefinitionById(String id) {
        return operationRepository.findOperationDefinitionById(id);
    }
}
