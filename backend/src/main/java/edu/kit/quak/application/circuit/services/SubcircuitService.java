package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.in.SubcircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.SubcircuitOption;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.user.model.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubcircuitService implements SubcircuitServicePort {

    private final CircuitRepositoryPort circuitRepository;
    private final FileServicePort fileService;

    @Override
    public Map<String, String> resolveNames(Collection<String> circuitIds, String projectId, User user) {
        Map<String, String> names = new HashMap<>();
        for (String circuitId : Set.copyOf(circuitIds)) {
            resolveName(circuitId, projectId, user).ifPresent(name -> names.put(circuitId, name));
        }
        return names;
    }

    @Override
    public List<SubcircuitOption> listAvailable(String projectId, String excludeCircuitId, User user) {
        List<SubcircuitOption> options = new ArrayList<>();
        for (QuantumCircuit candidate : circuitRepository.findAllByProjectId(projectId)) {
            if (candidate.getId() == null || candidate.getId().equals(excludeCircuitId)) {
                continue;
            }
            // Reusing resolveName is what keeps the access check in one place: a circuit whose file
            // the user may not read has no name and is therefore not offered either.
            resolveName(candidate.getId(), projectId, user).ifPresent(name ->
                options.add(new SubcircuitOption(candidate.getId(), name, qubitCountOf(candidate)))
            );
        }
        return options;
    }

    private static int qubitCountOf(QuantumCircuit circuit) {
        return circuit
            .getRegisters()
            .stream()
            .filter(QuantumRegister.class::isInstance)
            .mapToInt(register -> ((QuantumRegister) register).getNumberOfQubits())
            .sum();
    }

    private Optional<String> resolveName(String circuitId, String projectId, User user) {
        if (circuitId == null || circuitId.isBlank()) {
            return Optional.empty();
        }
        Optional<QuantumCircuit> referenced = circuitRepository.findById(circuitId);
        // Staying inside the project is what keeps this from being a lookup oracle: the id is
        // client-supplied, so without the check a crafted circuit could read foreign file names.
        if (referenced.isEmpty() || !projectId.equals(referenced.get().getProjectId())) {
            return Optional.empty();
        }
        String fileId = referenced.get().getFileId();
        if (fileId == null) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(fileService.retrieveFile(fileId, user)).map(file -> file.getName());
        } catch (RuntimeException e) {
            // A missing file or a denied read must not fail the whole circuit request; the box then
            // falls back to showing the id.
            log.debug("Could not resolve the name of subcircuit {}: {}", circuitId, e.getMessage());
            return Optional.empty();
        }
    }
}
