package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.in.SubcircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;
import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.SubcircuitOption;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.user.model.User;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
        List<QuantumCircuit> all = circuitRepository.findAllByProjectId(projectId);
        Map<String, List<String>> referenceGraph = new HashMap<>();
        for (QuantumCircuit circuit : all) {
            if (circuit.getId() != null) {
                referenceGraph.put(circuit.getId(), referencesOf(circuit));
            }
        }

        List<SubcircuitOption> options = new ArrayList<>();
        for (QuantumCircuit candidate : all) {
            if (candidate.getId() == null || candidate.getId().equals(excludeCircuitId)) {
                continue;
            }
            // Being a subcircuit is declared, not inferred. Every file gets a circuit as soon as it
            // is opened, so without this the list would offer whatever the user happened to look at.
            if (!candidate.isOfferedAsSubcircuit()) {
                continue;
            }
            // A candidate that already leads back here would close a loop. Rejecting it at the drop
            // would be too late in the wrong way: the tile should not be offered in the first place.
            if (excludeCircuitId != null && reaches(candidate.getId(), excludeCircuitId, referenceGraph)) {
                continue;
            }
            // Reusing resolveName is what keeps the access check in one place: a circuit whose file
            // the user may not read has no name and is therefore not offered either.
            resolveName(candidate.getId(), projectId, user).ifPresent(name ->
                options.add(
                    new SubcircuitOption(
                        candidate.getId(),
                        candidate.getFileId(),
                        name,
                        qubitCountOf(candidate),
                        operationCountOf(candidate)
                    )
                )
            );
        }
        return options;
    }

    @Override
    public void offerAsSubcircuit(String circuitId, User user) {
        QuantumCircuit circuit = circuitRepository
            .findById(circuitId)
            .orElseThrow(() -> new ResourceNotFoundException("Circuit", circuitId));
        if (circuit.isOfferedAsSubcircuit()) {
            return;
        }
        circuit.setOfferedAsSubcircuit(true);
        circuitRepository.save(circuit);
        log.info("Circuit is now offered as a subcircuit. circuitId={}", circuitId);
    }

    /** The circuits this one calls directly. */
    private static List<String> referencesOf(QuantumCircuit circuit) {
        return circuit
            .getLayers()
            .stream()
            .flatMap(layer -> layer.getQuantumOperations().stream())
            .filter(SubcircuitOperation.class::isInstance)
            .map(operation -> ((SubcircuitOperation) operation).getDefinitionCircuitId())
            .filter(Objects::nonNull)
            .distinct()
            .toList();
    }

    /** Whether {@code target} is reachable from {@code start} by following subcircuit references. */
    private static boolean reaches(String start, String target, Map<String, List<String>> graph) {
        Deque<String> pending = new ArrayDeque<>(List.of(start));
        Set<String> seen = new HashSet<>();
        while (!pending.isEmpty()) {
            String current = pending.poll();
            if (!seen.add(current)) {
                continue;
            }
            if (current.equals(target)) {
                return true;
            }
            pending.addAll(graph.getOrDefault(current, List.of()));
        }
        return false;
    }

    private static int operationCountOf(QuantumCircuit circuit) {
        return circuit
            .getLayers()
            .stream()
            .mapToInt(layer -> layer.getQuantumOperations().size())
            .sum();
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
