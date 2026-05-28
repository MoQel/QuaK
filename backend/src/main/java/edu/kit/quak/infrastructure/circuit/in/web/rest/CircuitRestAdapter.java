package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.AddQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.MoveQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.RegisterRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.ElementSelectorDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.QuantumOperationDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
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
    private final UserServicePort userService;
    private final CircuitDtoMapper mapper;
    private final QuantumOperationDtoMapper quantumOperationDtoMapper;
    private final ElementSelectorDtoMapper elementSelectorDtoMapper;
    private final AuthenticationMapper authMapper;

    public CircuitRestAdapter(
        CircuitServicePort service,
        UserServicePort userService,
        CircuitDtoMapper mapper,
        QuantumOperationDtoMapper quantumOperationDtoMapper,
        ElementSelectorDtoMapper elementSelectorDtoMapper,
        AuthenticationMapper authMapper
    ) {
        this.service = service;
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
        QuantumCircuit circuit = service.getByProjectId(projectId, user);
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
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.resetCircuit(circuitId, user);
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
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        service.delete(circuitId, user);
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
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.addQubit(circuitId, registerId, user);
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
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));

        QuantumCircuit circuit = service.removeQubit(circuitId, registerId, qubitIdx, user);
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
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));

        QuantumOperation operation = quantumOperationDtoMapper.toDomain(request.quantumOperation());
        QuantumCircuit circuit = service.addQuantumOperation(circuitId, operation, request.layerIdx(), user);
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
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));

        List<ElementSelector> targetQubits = request.targetQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        List<ElementSelector> controlQubits = request.controlQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        QuantumCircuit circuit = service.moveQuantumOperation(
            circuitId,
            request.quantumOperationId(),
            request.layerIdx(),
            targetQubits,
            controlQubits,
            user
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
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));

        QuantumCircuit circuit = service.removeQuantumOperation(circuitId, operationId, user);
        return mapper.toResponse(circuit);
    }

    /**
     * Creates a new register (QuantumRegister or ClassicRegister) in the specified circuit.
     */
    @PostMapping("/{circuitId}/register")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse addRegister(
        @PathVariable String circuitId,
        @RequestBody RegisterRequest request,
        Authentication authentication
    ) {
        log.info("REST request to add register '{}' of type '{}' to circuit '{}'", request.name(), request.type(), circuitId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.addRegister(circuitId, request.name(), request.type(), request.size(), user);
        return mapper.toResponse(circuit);
    }

    /**
     * Deletes a register and all associated operations from the circuit.
     */
    @DeleteMapping("/{circuitId}/register/{registerId}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse deleteRegister(@PathVariable String circuitId, @PathVariable String registerId, Authentication authentication) {
        log.info("REST request to delete register '{}' from circuit '{}'", registerId, circuitId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.deleteRegister(circuitId, registerId, user);
        return mapper.toResponse(circuit);
    }

    /**
     * Adds a classic bit to a ClassicRegister.
     */
    @PostMapping("/{circuitId}/register/{registerId}/bit")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse addClassicBit(@PathVariable String circuitId, @PathVariable String registerId, Authentication authentication) {
        log.info("REST request to add classic bit to register '{}' in circuit '{}'", registerId, circuitId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.addClassicBit(circuitId, registerId, user);
        return mapper.toResponse(circuit);
    }

    /**
     * Removes a classic bit from a ClassicRegister.
     */
    @DeleteMapping("/{circuitId}/register/{registerId}/bit/{bitIdx}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse removeClassicBit(
        @PathVariable String circuitId,
        @PathVariable String registerId,
        @PathVariable int bitIdx,
        Authentication authentication
    ) {
        log.info("REST request to remove classic bit at index {} from register '{}' in circuit '{}'", bitIdx, registerId, circuitId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.removeClassicBit(circuitId, registerId, bitIdx, user);
        return mapper.toResponse(circuit);
    }
}
