package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.in.SubcircuitNameServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.user.model.User;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubcircuitNameService implements SubcircuitNameServicePort {

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
