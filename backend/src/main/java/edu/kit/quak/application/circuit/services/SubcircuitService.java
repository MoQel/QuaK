package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.in.SubcircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.SubcircuitOption;
import edu.kit.quak.core.circuit.service.SubcircuitReferences;
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
        for (QuantumCircuit candidate : SubcircuitReferences.offerableTo(
            excludeCircuitId,
            circuitRepository.findAllByProjectId(projectId)
        )) {
            // Reusing resolveName is what keeps the access check in one place: a circuit whose file
            // the user may not read has no name and is therefore not offered either.
            resolveName(candidate.getId(), projectId, user).ifPresent(name ->
                options.add(
                    new SubcircuitOption(candidate.getId(), candidate.getFileId(), name, candidate.qubitCount(), candidate.operationCount())
                )
            );
        }
        return options;
    }

    @Override
    public List<String> listDisallowedFileIds(String projectId, String currentCircuitId, User user) {
        if (projectId == null || projectId.isBlank()) {
            return List.of();
        }
        return new ArrayList<>(
            SubcircuitReferences.disallowedFileIdsFor(currentCircuitId, circuitRepository.findAllByProjectId(projectId))
        );
    }

    @Override
    public void offerAsSubcircuit(String circuitId, String forCircuitId, User user) {
        QuantumCircuit circuit = circuitRepository
            .findById(circuitId)
            .orElseThrow(() -> new ResourceNotFoundException("Circuit", circuitId));

        if (forCircuitId != null) {
            SubcircuitReferences.ensureCanBeOfferedTo(circuit, forCircuitId, circuitRepository.findAllByProjectId(circuit.getProjectId()));
        }

        if (circuit.isOfferedAsSubcircuit()) {
            return;
        }
        circuit.setOfferedAsSubcircuit(true);
        circuitRepository.save(circuit);
        log.info("Circuit is now offered as a subcircuit. circuitId={}", circuitId);
    }

    @Override
    public void revokeSubcircuit(String circuitId, User user) {
        QuantumCircuit circuit = circuitRepository
            .findById(circuitId)
            .orElseThrow(() -> new ResourceNotFoundException("Circuit", circuitId));
        if (!circuit.isOfferedAsSubcircuit()) {
            return;
        }
        circuit.setOfferedAsSubcircuit(false);
        circuitRepository.save(circuit);
        log.info("Circuit is no longer offered as a subcircuit. circuitId={}", circuitId);
    }

    @Override
    public Optional<QuantumCircuit> resolveDefinition(String circuitId, String projectId, User user) {
        return referencedCircuit(circuitId, projectId);
    }

    /** The referenced circuit, if it exists and belongs to the same project. */
    private Optional<QuantumCircuit> referencedCircuit(String circuitId, String projectId) {
        if (circuitId == null || circuitId.isBlank()) {
            return Optional.empty();
        }
        Optional<QuantumCircuit> referenced = circuitRepository.findById(circuitId);
        // Staying inside the project is what keeps this from being a lookup oracle: the id is
        // client-supplied, so without the check a crafted circuit could read foreign circuits.
        if (referenced.isEmpty() || !projectId.equals(referenced.get().getProjectId())) {
            return Optional.empty();
        }
        return referenced;
    }

    private Optional<String> resolveName(String circuitId, String projectId, User user) {
        if (circuitId == null || circuitId.isBlank()) {
            return Optional.empty();
        }
        Optional<QuantumCircuit> referenced = referencedCircuit(circuitId, projectId);
        if (referenced.isEmpty()) {
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
