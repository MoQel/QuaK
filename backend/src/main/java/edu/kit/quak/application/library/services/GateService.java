package edu.kit.quak.application.library.services;

import edu.kit.quak.application.library.ports.in.GateServicePort;
import edu.kit.quak.application.library.ports.out.GateRepositoryPort;
import edu.kit.quak.core.library.model.Gate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GateService implements GateServicePort {

    private final GateRepositoryPort gateRepository;

    public GateService(GateRepositoryPort gateRepository) {
        this.gateRepository = gateRepository;
    }

    @Override
    public List<Gate> getAllGates() {
        return gateRepository.findAllGates();
    }

    @Override
    public Optional<Gate> getGateById(String id) {
        return gateRepository.findGateById(id);
    }
}