package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.exceptions.CircuitNotFoundException;
import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.application.common.exceptions.AccessDeniedException;
import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;
import edu.kit.quak.application.filesystem.delegator.FileElementContainerRepositoryDelegator;
import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.core.common.exception.DomainRuleViolationException;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class CircuitService implements CircuitServicePort {

    private final CircuitRepositoryPort repository;
    private final ProjectRoleServicePort projectRoleService;
    private final FileRepositoryPort fileRepository;
    private final FileElementContainerRepositoryDelegator fileElementDelegator;

    public CircuitService(
        CircuitRepositoryPort repository,
        ProjectRoleServicePort projectRoleService,
        FileRepositoryPort fileRepository,
        FileElementContainerRepositoryDelegator fileElementDelegator
    ) {
        this.repository = repository;
        this.projectRoleService = projectRoleService;
        this.fileRepository = fileRepository;
        this.fileElementDelegator = fileElementDelegator;
    }

    @Override
    public QuantumCircuit getById(String circuitId) {
        return repository
            .findById(circuitId)
            .orElseThrow(() -> {
                log.warn("Circuit lookup failed. circuitId={}", circuitId);
                return new CircuitNotFoundException("Circuit not found: " + circuitId);
            });
    }

    @Override
    public QuantumCircuit getOrCreateByFileId(String fileId, User user) {
        File file = fileRepository.findById(fileId).orElseThrow(() -> new ResourceNotFoundException("File", fileId));
        String projectId = resolveProjectId(file.getParentId());
        verifyAccess(projectId, user, ProjectRole.VIEWER);

        return repository
            .findByFileId(fileId)
            .orElseGet(() -> {
                QuantumCircuit circuit = new QuantumCircuit(projectId, fileId);
                // A read-only VIEWER must not cause writes; hand back a transient circuit instead of persisting.
                if (!projectRoleService.hasMinimumRole(projectId, user.getId(), ProjectRole.OWNER)) {
                    return circuit;
                }
                log.info("Initialized new quantum circuit for file. circuitId={}, fileId={}", circuit.getId(), fileId);
                return repository.save(circuit);
            });
    }

    @Override
    public void deleteByFileId(String fileId) {
        log.info("Deleting circuit linked to file. fileId={}", fileId);
        repository.deleteByFileId(fileId);
    }

    @Override
    public void deleteAllByProjectId(String projectId) {
        log.info("Deleting all circuits of project. projectId={}", projectId);
        repository.deleteAllByProjectId(projectId);
    }

    @Override
    public QuantumCircuit replaceContent(String circuitId, List<Register> registers, List<Layer> layers, User user) {
        log.info("Replacing content of circuit. circuitId={}", circuitId);
        QuantumCircuit existing = getById(circuitId);
        verifyAccess(existing.getProjectId(), user, ProjectRole.OWNER);
        verifyOperationIdIntegrity(existing, layers);

        // Only registers and layers are content. Everything else the circuit knows about itself has
        // to be carried over by hand here, or a plain autosave would quietly reset it - which is
        // what happened to the subcircuit flag: declaring a circuit a building block survived until
        // the next edit of it.
        QuantumCircuit replacement = QuantumCircuit.builder()
            .id(existing.getId())
            .projectId(existing.getProjectId())
            .fileId(existing.getFileId())
            .offeredAsSubcircuit(existing.isOfferedAsSubcircuit())
            .registers(registers)
            .layers(layers)
            .build();
        touchProject(existing.getProjectId());
        return repository.save(replacement);
    }

    /**
     * Client-supplied operation ids are persisted as-is (stable identity across
     * full-replace saves), so they must not collide: an id may either already belong
     * to this circuit or be entirely new — reusing an id that is persisted for
     * another circuit would silently steal that row on save.
     */
    private void verifyOperationIdIntegrity(QuantumCircuit existing, List<Layer> incomingLayers) {
        List<String> incomingIds = incomingLayers
            .stream()
            .flatMap(layer -> layer.getQuantumOperations().stream())
            .map(QuantumOperation::getId)
            .toList();

        if (incomingIds.size() != Set.copyOf(incomingIds).size()) {
            throw new DomainRuleViolationException("Duplicate operation ids in circuit content");
        }

        Set<String> ownIds = existing
            .getLayers()
            .stream()
            .flatMap(layer -> layer.getQuantumOperations().stream())
            .map(QuantumOperation::getId)
            .collect(Collectors.toSet());

        List<String> unknownIds = incomingIds
            .stream()
            .filter(id -> !ownIds.contains(id))
            .toList();
        List<String> takenElsewhere = repository.findExistingOperationIds(unknownIds);
        if (!takenElsewhere.isEmpty()) {
            log.warn(
                "Rejected circuit content: operation ids belong to another circuit. circuitId={}, ids={}",
                existing.getId(),
                takenElsewhere
            );
            throw new DomainRuleViolationException("Operation ids already in use by another circuit: " + takenElsewhere);
        }
    }

    private void touchProject(String projectId) {
        fileElementDelegator.touchRootProject(projectId);
    }

    private String resolveProjectId(String parentId) {
        if (parentId.charAt(0) == 'p') {
            return parentId;
        }
        return fileElementDelegator
            .findProjectIdByElementId(parentId)
            .orElseThrow(() -> new IllegalStateException("Could not find root project for element with ID: " + parentId));
    }

    @Override
    public void delete(String circuitId, User user) {
        log.info("Deleting circuit. circuitId={}", circuitId);
        QuantumCircuit existing = getById(circuitId);
        verifyAccess(existing.getProjectId(), user, ProjectRole.OWNER);
        repository.delete(circuitId);
        touchProject(existing.getProjectId());
    }

    @Override
    public QuantumCircuit resetCircuit(String circuitId, User user) {
        QuantumCircuit existing = getById(circuitId);
        verifyAccess(existing.getProjectId(), user, ProjectRole.OWNER);

        String projectId = existing.getProjectId();
        String fileId = existing.getFileId();
        repository.delete(circuitId);

        touchProject(projectId);
        QuantumCircuit circuit = new QuantumCircuit(projectId, fileId);
        log.info("Initialized new quantum circuit for file. circuitId={}, fileId={}", circuit.getId(), fileId);
        return repository.save(circuit);
    }

    @Override
    public QuantumCircuit addQubit(String circuitId, String registerId, User user) {
        log.info("Adding qubit to register. circuitId={}, registerId={}", circuitId, registerId);
        return updateCircuit(circuitId, circuit -> circuit.addQubit(registerId), user, ProjectRole.OWNER);
    }

    @Override
    public QuantumCircuit removeQubit(String circuitId, String registerId, int qubitIdx, User user) {
        log.info("Removing qubit from register. circuitId={}, registerId={}, idx={}", circuitId, registerId, qubitIdx);
        return updateCircuit(circuitId, circuit -> circuit.removeQubit(registerId, qubitIdx), user, ProjectRole.OWNER);
    }

    @Override
    public QuantumCircuit addQuantumOperation(String circuitId, QuantumOperation operation, int layerIdx, User user) {
        log.info("Adding quantum operation to circuit. circuitId={}, layerIdx={}", circuitId, layerIdx);
        return updateCircuit(
            circuitId,
            circuit -> {
                verifyNewOperationId(circuit, operation);
                circuit.addQuantumOperation(operation, layerIdx);
            },
            user,
            ProjectRole.OWNER
        );
    }

    /** Same id-integrity rule as replaceContent, for a single operation added via the granular endpoint. */
    private void verifyNewOperationId(QuantumCircuit circuit, QuantumOperation operation) {
        String id = operation.getId();
        if (id == null) {
            return;
        }
        boolean inThisCircuit = circuit
            .getLayers()
            .stream()
            .flatMap(layer -> layer.getQuantumOperations().stream())
            .anyMatch(op -> id.equals(op.getId()));
        if (inThisCircuit) {
            throw new DomainRuleViolationException("Operation id already exists in this circuit: " + id);
        }
        if (!repository.findExistingOperationIds(List.of(id)).isEmpty()) {
            throw new DomainRuleViolationException("Operation id already in use by another circuit: " + id);
        }
    }

    @Override
    public QuantumCircuit moveQuantumOperation(
        String circuitId,
        String operationId,
        int layerIdx,
        List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits,
        User user
    ) {
        log.info("Moving quantum operation. circuitId={}, operationId={}", circuitId, operationId);
        return updateCircuit(
            circuitId,
            circuit -> circuit.moveQuantumOperation(operationId, layerIdx, targetQubits, controlQubits),
            user,
            ProjectRole.OWNER
        );
    }

    @Override
    public QuantumCircuit removeQuantumOperation(String circuitId, String operationId, User user) {
        return updateCircuit(circuitId, circuit -> circuit.removeQuantumOperation(operationId), user, ProjectRole.OWNER);
    }

    private QuantumCircuit updateCircuit(String circuitId, Consumer<QuantumCircuit> action, User user, ProjectRole minimumRole) {
        QuantumCircuit circuit = getById(circuitId);
        verifyAccess(circuit.getProjectId(), user, minimumRole);

        action.accept(circuit);
        touchProject(circuit.getProjectId());
        return repository.save(circuit);
    }

    private void verifyAccess(String projectId, User user, ProjectRole minimumRole) {
        if (!projectRoleService.hasMinimumRole(projectId, user.getId(), minimumRole)) {
            log.debug("Access denied: User '{}' does not have role '{}' on project '{}'", user.getId(), minimumRole, projectId);
            throw new AccessDeniedException("project", projectId);
        }
    }
}
