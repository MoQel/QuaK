package edu.kit.quak.application.library.services;

import edu.kit.quak.application.library.ports.in.GateDefinitionServicePort;
import edu.kit.quak.application.library.ports.out.GateDefinitionRepositoryPort;
import edu.kit.quak.core.library.model.GateDefinition;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GateDefinitionService implements GateDefinitionServicePort {

    private final GateDefinitionRepositoryPort gateRepository;

    public GateDefinitionService(GateDefinitionRepositoryPort gateRepository) {
        this.gateRepository = gateRepository;
    }

    @Override
    public List<GateDefinition> getAllGateDefinitions() {
        return gateRepository.findAllGateDefinitions();
    }

    @Override
    public Optional<GateDefinition> getGateDefinitionById(String id) {
        return gateRepository.findGateDefinitionById(id);
    }
}