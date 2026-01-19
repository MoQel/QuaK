package edu.kit.quak.application.library.ports.out;

import edu.kit.quak.core.library.model.Gate;
import java.util.List;
import java.util.Optional;

public interface GateRepositoryPort {
    List<Gate> findAllGates();

    Optional<Gate> findGateByName(String name);
}
