package edu.kit.quak.core.circuit.service;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.common.exception.DomainRuleViolationException;
import java.util.ArrayDeque;
import java.util.Collection;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Decides which circuits of a project may be called as subcircuits of another circuit, the host, so that
 * subcircuit calls never form a loop.
 */
public final class SubcircuitReferences {

    private SubcircuitReferences() {}

    /**
     * The circuits that can be offered to the host: circuits declared as subcircuits, other than the host, whose
     * calls do not lead back to it.
     *
     * @param hostCircuitId the circuit that would call them, or null when there is none yet
     */
    public static List<QuantumCircuit> offerableTo(String hostCircuitId, Collection<QuantumCircuit> projectCircuits) {
        Map<String, List<String>> graph = referenceGraph(projectCircuits);
        return projectCircuits
            .stream()
            .filter(candidate -> candidate.getId() != null && !candidate.getId().equals(hostCircuitId))
            .filter(QuantumCircuit::isOfferedAsSubcircuit)
            .filter(candidate -> hostCircuitId == null || !reaches(candidate.getId(), hostCircuitId, graph))
            .toList();
    }

    /**
     * The files that cannot be declared as new subcircuits of the host: the host's own file, files already
     * declared as subcircuits, and files whose circuits lead back to the host.
     *
     * @param hostCircuitId the circuit that would call them, or null when there is none yet
     */
    public static Set<String> disallowedFileIdsFor(String hostCircuitId, Collection<QuantumCircuit> projectCircuits) {
        Map<String, List<String>> graph = referenceGraph(projectCircuits);
        Set<String> disallowed = new HashSet<>();
        for (QuantumCircuit candidate : projectCircuits) {
            if (candidate.getFileId() != null && isDisallowed(candidate, hostCircuitId, graph)) {
                disallowed.add(candidate.getFileId());
            }
        }
        return disallowed;
    }

    /**
     * @throws DomainRuleViolationException if the circuit is the host itself, would lead back to the host, or is
     *     already declared as a subcircuit
     */
    public static void ensureCanBeOfferedTo(QuantumCircuit circuit, String hostCircuitId, Collection<QuantumCircuit> projectCircuits) {
        if (circuit.getId().equals(hostCircuitId)) {
            throw new DomainRuleViolationException("A circuit cannot reference itself as a subcircuit.");
        }
        if (reaches(circuit.getId(), hostCircuitId, referenceGraph(projectCircuits))) {
            throw new DomainRuleViolationException("Cannot add subcircuit: It would create a circular dependency.");
        }
        if (circuit.isOfferedAsSubcircuit()) {
            throw new DomainRuleViolationException("This circuit is already offered as a subcircuit.");
        }
    }

    private static boolean isDisallowed(QuantumCircuit candidate, String hostCircuitId, Map<String, List<String>> graph) {
        if (candidate.isOfferedAsSubcircuit()) {
            return true;
        }
        if (hostCircuitId == null || candidate.getId() == null) {
            return false;
        }
        return candidate.getId().equals(hostCircuitId) || reaches(candidate.getId(), hostCircuitId, graph);
    }

    private static Map<String, List<String>> referenceGraph(Collection<QuantumCircuit> circuits) {
        Map<String, List<String>> graph = new HashMap<>();
        for (QuantumCircuit circuit : circuits) {
            if (circuit.getId() != null) {
                graph.put(circuit.getId(), circuit.referencedCircuitIds());
            }
        }
        return graph;
    }

    /** Whether {@code target} is reachable from {@code start} by following subcircuit calls. */
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
}
