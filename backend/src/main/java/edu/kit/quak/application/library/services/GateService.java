package edu.kit.quak.application.library.services;

import edu.kit.quak.application.library.ports.in.GateServicePort;
import edu.kit.quak.application.library.ports.out.GateRepositoryPort;
import edu.kit.quak.core.library.model.Gate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class GateService implements GateServicePort {

    private final GateRepositoryPort gateRepository;

    public GateService(GateRepositoryPort gateRepository) {
        this.gateRepository = gateRepository;
    }

    @Override
    public List<Gate> getAllGates() {
        log.debug("Retrieving all gates");
        return gateRepository.findAllGates();
    }

    @Override
    public Optional<Gate> getGateByName(String name) {
        log.debug("Retrieving gate with name: '{}'", name);
        return gateRepository.findGateByName(name);
    }
}