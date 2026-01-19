package edu.kit.quak.application.library.ports.in;

import edu.kit.quak.core.library.model.Gate;
import java.util.List;
import java.util.Optional;

public interface GateServicePort {
    List<Gate> getAllGates();
    Optional<Gate> getGateById(String id);
}