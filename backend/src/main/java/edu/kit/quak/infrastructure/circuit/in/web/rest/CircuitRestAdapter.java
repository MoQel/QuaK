package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.AddQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.MoveQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.ElementSelectorDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.QuantumOperationDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/circuit")
public class CircuitRestAdapter {

    private final CircuitServicePort service;
    private final ProjectServicePort projectService;
    private final UserServicePort userService;
    private final CircuitDtoMapper mapper;
    private final QuantumOperationDtoMapper quantumOperationDtoMapper;
    private final ElementSelectorDtoMapper elementSelectorDtoMapper;
    private final AuthenticationMapper authMapper;

    public CircuitRestAdapter(
        CircuitServicePort service,
        ProjectServicePort projectService,
        UserServicePort userService,
        CircuitDtoMapper mapper,
        QuantumOperationDtoMapper quantumOperationDtoMapper,
        ElementSelectorDtoMapper elementSelectorDtoMapper,
        AuthenticationMapper authMapper
    ) {
        this.service = service;
        this.projectService = projectService;
        this.userService = userService;
        this.mapper = mapper;
        this.quantumOperationDtoMapper = quantumOperationDtoMapper;
        this.elementSelectorDtoMapper = elementSelectorDtoMapper;
        this.authMapper = authMapper;
    }

    /**
     * Retrieves the circuit for a given project.
     * Ownership is verified via the project.
     */
    @GetMapping("/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse getByProjectId(@PathVariable String projectId, Authentication authentication) {
        log.debug("REST request to get circuit by the projectId: {}", projectId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        QuantumCircuit circuit = service.getByProjectId(projectId);
        return mapper.toResponse(circuit);
    }

    /**
     * Resets a specific circuit (deletes it, creates a fresh one with the same
     * projectId).
     * Ownership is verified via the circuit's associated project.
     * Using circuitId here ensures this works correctly when multiple circuits per
     * project are supported.
     */
    @DeleteMapping("/{circuitId}/reset")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse reset(@PathVariable String circuitId, Authentication authentication) {
        log.info("REST request to reset a specific circuit");
        verifyCircuitOwnership(circuitId, authentication);

        QuantumCircuit circuit = service.resetCircuit(circuitId);
        return mapper.toResponse(circuit);
    }

    /**
     * Deletes a specific circuit identified by its unique circuitId.
     * Ownership is verified via the circuit's associated project.
     */
    @DeleteMapping("/{circuitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void delete(@PathVariable String circuitId, Authentication authentication) {
        log.info("REST request to delete circuit: {}", circuitId);
        verifyCircuitOwnership(circuitId, authentication);
        service.delete(circuitId);
    }

    /**
     * Adds a qubit to the circuit identified by its unique circuitId.
     * Ownership is verified via the circuit's associated project.
     */
    @PostMapping("/{circuitId}/register/{registerId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse addQubit(@PathVariable String circuitId, @PathVariable String registerId, Authentication authentication) {
        log.info("REST request to add qubit to register '{}' in circuit '{}'", registerId, circuitId);
        verifyCircuitOwnership(circuitId, authentication);
        QuantumCircuit circuit = service.addQubit(circuitId, registerId);
        return mapper.toResponse(circuit);
    }

    /**
     * Removes a qubit from the circuit identified by its unique circuitId.
     * Ownership is verified via the circuit's associated project.
     */
    @DeleteMapping("/{circuitId}/register/{registerId}/{qubitIdx}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse removeQubit(
        @PathVariable String circuitId,
        @PathVariable String registerId,
        @PathVariable int qubitIdx,
        Authentication authentication
    ) {
        log.info("REST request to remove qubit at index {} from register '{}' in circuit '{}'", qubitIdx, registerId, circuitId);
        verifyCircuitOwnership(circuitId, authentication);

        QuantumCircuit circuit = service.removeQubit(circuitId, registerId, qubitIdx);
        return mapper.toResponse(circuit);
    }

    /**
     * Adds a quantum operation to the circuit identified by its unique circuitId.
     * Ownership is verified via the circuit's associated project.
     */
    @PostMapping("/{circuitId}/operation")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse addQuantumOperation(
        @PathVariable String circuitId,
        @RequestBody AddQuantumOperationRequest request,
        Authentication authentication
    ) {
        log.info("REST request to add operation to circuit '{}' at layer {}", circuitId, request.layerIdx());
        verifyCircuitOwnership(circuitId, authentication);

        QuantumOperation operation = quantumOperationDtoMapper.toDomain(request.quantumOperation());
        QuantumCircuit circuit = service.addQuantumOperation(circuitId, operation, request.layerIdx());
        return mapper.toResponse(circuit);
    }

    /**
     * Moves a quantum operation within the circuit identified by its unique
     * circuitId.
     * Ownership is verified via the circuit's associated project.
     */
    @PatchMapping("/{circuitId}/operation")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse moveQuantumOperation(
        @PathVariable String circuitId,
        @RequestBody MoveQuantumOperationRequest request,
        Authentication authentication
    ) {
        log.info(
            "REST request to move operation '{}' in circuit '{}' to layer {}",
            request.quantumOperationId(),
            circuitId,
            request.layerIdx()
        );
        verifyCircuitOwnership(circuitId, authentication);

        List<ElementSelector> targetQubits = request.targetQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        List<ElementSelector> controlQubits = request.controlQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        QuantumCircuit circuit = service.moveQuantumOperation(
            circuitId,
            request.quantumOperationId(),
            request.layerIdx(),
            targetQubits,
            controlQubits
        );
        return mapper.toResponse(circuit);
    }

    /**
     * Removes a quantum operation from the circuit identified by its unique
     * circuitId.
     * Ownership is verified via the circuit's associated project.
     */
    @DeleteMapping("/{circuitId}/operation/{operationId}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse removeQuantumOperation(
        @PathVariable String circuitId,
        @PathVariable String operationId,
        Authentication authentication
    ) {
        log.info("REST request to remove operation '{}' from circuit '{}'", operationId, circuitId);
        verifyCircuitOwnership(circuitId, authentication);

        QuantumCircuit circuit = service.removeQuantumOperation(circuitId, operationId);
        return mapper.toResponse(circuit);
    }

    /**
     * Verifies that the authenticated user owns the project associated with the
     * given circuit.
     *
     * <p>
     * The ownership chain is: {@code User → Project → Circuit}.
     * Since each circuit belongs to exactly one project, and each project belongs
     * to
     * exactly one owner, we resolve ownership by looking up the circuit's project
     * and
     * delegating to {@link ProjectServicePort#retrieveProject}, which throws
     * {@link edu.kit.quak.application.common.exceptions.AccessDeniedException}
     * if the user is not the owner.
     *
     * @param circuitId      the unique ID of the circuit to authorize against
     * @param authentication the current Spring Security authentication token
     * @throws EntityNotFoundException Returns error if no circuit with the given ID exists
     * @throws edu.kit.quak.application.common.exceptions.AccessDeniedException if the user does not own the project
     */
    private void verifyCircuitOwnership(String circuitId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.getById(circuitId);
        projectService.retrieveProject(circuit.getProjectId(), user);
    }
}
