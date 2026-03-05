package edu.kit.quak.application.library.services;

import edu.kit.quak.application.library.exceptions.OperationDefinitionNotFoundException;
import edu.kit.quak.application.library.ports.in.OperationDefinitionServicePort;
import edu.kit.quak.application.library.ports.out.OperationDefinitionRepositoryPort;
import edu.kit.quak.core.library.model.OperationDefinition;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
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
    public OperationDefinition getOperationDefinitionById(String id) {
        return operationRepository
            .findOperationDefinitionById(id)
            .orElseThrow(() -> {
                log.warn("Gate definition lookup failed. id={}", id);
                return new OperationDefinitionNotFoundException(id);
            });
    }
}
