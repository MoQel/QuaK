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
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CircuitResponse> getByProjectId(@PathVariable String projectId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        Optional<QuantumCircuit> circuit = service.getByProjectId(projectId);
        return circuit.map(mapper::toResponse).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse reset(@PathVariable String projectId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        QuantumCircuit circuit = service.resetByProjectId(projectId);
        return mapper.toResponse(circuit);
    }

    @PostMapping("/{projectId}/register/{registerId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse addQubit(@PathVariable String projectId, @PathVariable String registerId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        QuantumCircuit circuit = service.addQubit(projectId, registerId);
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{projectId}/register/{registerId}/{qubitIdx}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse removeQubit(
        @PathVariable String projectId,
        @PathVariable String registerId,
        @PathVariable int qubitIdx,
        Authentication authentication
    ) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        QuantumCircuit circuit = service.removeQubit(projectId, registerId, qubitIdx);
        return mapper.toResponse(circuit);
    }

    @PostMapping("/{projectId}/operation")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse addQuantumOperation(
        @PathVariable String projectId,
        @RequestBody AddQuantumOperationRequest request,
        Authentication authentication
    ) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        QuantumOperation operation = quantumOperationDtoMapper.toDomain(request.quantumOperation());
        QuantumCircuit circuit = service.addQuantumOperation(projectId, operation, request.layerIdx());
        return mapper.toResponse(circuit);
    }

    @PatchMapping("/{projectId}/operation")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse moveQuantumOperation(
        @PathVariable String projectId,
        @RequestBody MoveQuantumOperationRequest request,
        Authentication authentication
    ) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        List<ElementSelector> targetQubits = request.targetQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        List<ElementSelector> controlQubits = request.controlQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        QuantumCircuit circuit = service.moveQuantumOperation(
            projectId,
            request.quantumOperationId(),
            request.layerIdx(),
            targetQubits,
            controlQubits
        );
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{projectId}/operation/{operationId}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse removeQuantumOperation(
        @PathVariable String projectId,
        @PathVariable String operationId,
        Authentication authentication
    ) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        projectService.retrieveProject(projectId, user); // Verify ownership

        QuantumCircuit circuit = service.removeQuantumOperation(projectId, operationId);
        return mapper.toResponse(circuit);
    }
}
