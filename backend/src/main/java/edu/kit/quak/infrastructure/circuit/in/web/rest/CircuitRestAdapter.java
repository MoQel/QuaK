package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.circuit.ports.in.SubcircuitServicePort;
import edu.kit.quak.application.circuit.services.ProjectQasmIncludeResolver;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.circuit.codegen.QasmCodeGenerator;
import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.AddQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitContentResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.GeneratedCodeResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.MoveQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.SubcircuitOperationDto;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.SubcircuitOptionResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.UpdateCircuitRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.ElementSelectorDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.LayerDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.LoopBlockDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.QuantumOperationDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.RegisterDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/circuit")
public class CircuitRestAdapter {

    private final CircuitServicePort service;
    private final SubcircuitServicePort subcircuitNames;
    private final QasmService qasmService;
    private final ProjectQasmIncludeResolver includeResolver;
    private final UserServicePort userService;
    private final CircuitDtoMapper mapper;
    private final QuantumOperationDtoMapper quantumOperationDtoMapper;
    private final ElementSelectorDtoMapper elementSelectorDtoMapper;
    private final RegisterDtoMapper registerDtoMapper;
    private final LayerDtoMapper layerDtoMapper;
    private final LoopBlockDtoMapper loopBlockDtoMapper;
    private final AuthenticationMapper authMapper;

    public CircuitRestAdapter(
        CircuitServicePort service,
        SubcircuitServicePort subcircuitNames,
        QasmService qasmService,
        ProjectQasmIncludeResolver includeResolver,
        UserServicePort userService,
        CircuitDtoMapper mapper,
        QuantumOperationDtoMapper quantumOperationDtoMapper,
        ElementSelectorDtoMapper elementSelectorDtoMapper,
        RegisterDtoMapper registerDtoMapper,
        LayerDtoMapper layerDtoMapper,
        LoopBlockDtoMapper loopBlockDtoMapper,
        AuthenticationMapper authMapper
    ) {
        this.service = service;
        this.subcircuitNames = subcircuitNames;
        this.qasmService = qasmService;
        this.includeResolver = includeResolver;
        this.userService = userService;
        this.mapper = mapper;
        this.quantumOperationDtoMapper = quantumOperationDtoMapper;
        this.elementSelectorDtoMapper = elementSelectorDtoMapper;
        this.registerDtoMapper = registerDtoMapper;
        this.layerDtoMapper = layerDtoMapper;
        this.loopBlockDtoMapper = loopBlockDtoMapper;
        this.authMapper = authMapper;
    }

    /**
     * Maps a circuit and fills in the display name of every subcircuit it references.
     *
     * <p>The name is not part of the stored operation - it is the file the referenced circuit
     * belongs to, looked up per response. Storing it would go stale the moment that file is renamed.
     * A reference that cannot be resolved simply keeps a null name, and the editor falls back to
     * showing the id.
     */
    private CircuitResponse toResponse(QuantumCircuit circuit, User user) {
        CircuitResponse response = mapper.toResponse(circuit);
        List<SubcircuitOperationDto> subcircuits = response
            .layers()
            .stream()
            .flatMap(layer -> layer.quantumOperations().stream())
            .filter(SubcircuitOperationDto.class::isInstance)
            .map(SubcircuitOperationDto.class::cast)
            .toList();
        if (subcircuits.isEmpty()) {
            return response;
        }

        Map<String, String> names = subcircuitNames.resolveNames(
            subcircuits.stream().map(SubcircuitOperationDto::getDefinitionCircuitId).toList(),
            circuit.getProjectId(),
            user
        );
        subcircuits.forEach(subcircuit -> subcircuit.setDefinitionName(names.get(subcircuit.getDefinitionCircuitId())));
        return response;
    }

    /**
     * Lists the circuits of the project that can be dropped in as a subcircuit.
     *
     * <p>Reads only: unlike {@code GET /file/{fileId}} this creates no circuit, so opening the
     * library does not give every file in the project one. A circuit the user may not read is
     * absent rather than an error.
     *
     * @param excludeCircuitId the circuit being edited, so it is not offered inside itself
     */
    @GetMapping("/project/{projectId}/subcircuits")
    @PreAuthorize("isAuthenticated()")
    public List<SubcircuitOptionResponse> listSubcircuits(
        @PathVariable String projectId,
        @RequestParam(required = false) String excludeCircuitId,
        Authentication authentication
    ) {
        log.debug("REST request to list subcircuits of project: {}", projectId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        return subcircuitNames
            .listAvailable(projectId, excludeCircuitId, user)
            .stream()
            .map(option ->
                new SubcircuitOptionResponse(
                    option.circuitId(),
                    option.fileId(),
                    option.name(),
                    option.qubitCount(),
                    option.operationCount()
                )
            )
            .toList();
    }

    /**
     * Declares the circuit of the given file to be available as a subcircuit, creating it if the
     * file does not have one yet.
     *
     * <p>This is where the creating read of {@code GET /file/{fileId}} is intended: the user picked
     * exactly this file. Listing subcircuits stays free of that side effect, and free of files
     * nobody declared.
     */
    @PostMapping("/file/{fileId}/subcircuit")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse offerAsSubcircuit(@PathVariable String fileId, Authentication authentication) {
        log.debug("REST request to offer the circuit of file {} as a subcircuit", fileId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.getOrCreateByFileId(fileId, user);
        subcircuitNames.offerAsSubcircuit(circuit.getId(), user);
        return toResponse(service.getOrCreateByFileId(fileId, user), user);
    }

    /**
     * Returns the circuit linked to the given file, creating it if it does not
     * exist yet. Ownership is verified via the file's project.
     */
    @GetMapping("/file/{fileId}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse getByFileId(@PathVariable String fileId, Authentication authentication) {
        log.debug("REST request to get circuit by fileId: {}", fileId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.getOrCreateByFileId(fileId, user);
        return toResponse(circuit, user);
    }

    /**
     * Replaces the full content (registers and layers) of a specific circuit.
     * Used by the circuit editor to persist client-side edits and parse results.
     * Ownership is verified via the circuit's associated project.
     */
    @PutMapping("/{circuitId}")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse replaceContent(
        @PathVariable String circuitId,
        @RequestBody UpdateCircuitRequest request,
        Authentication authentication
    ) {
        log.debug("REST request to replace content of circuit: {}", circuitId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));

        QuantumCircuit circuit = service.replaceContent(circuitId, toRegisters(request), toLayers(request), toLoopBlocks(request), user);
        return toResponse(circuit, user);
    }

    /**
     * Generates OpenQASM code from the given circuit content without persisting
     * anything. Counterpart of the /parse endpoint.
     */
    @PostMapping("/qasmCode")
    @PreAuthorize("isAuthenticated()")
    public GeneratedCodeResponse generateQasmCode(@RequestBody UpdateCircuitRequest request) {
        log.debug("REST request to generate code from circuit content");
        QuantumCircuit circuit = QuantumCircuit.builder()
            .registers(toRegisters(request))
            .layers(toLayers(request))
            .loopBlocks(toLoopBlocks(request))
            .build();
        // Canonicalize the layering (same ASAP + span-overlap rule the frontend renders with) so
        // the emitted "// Layer N" blocks match the rendered circuit columns.
        circuit.reschedule();
        return new GeneratedCodeResponse(QasmCodeGenerator.toCode(circuit));
    }

    /**
     * Parses OpenQASM code into circuit content (registers and layers) without
     * persisting anything. Counterpart of the /qasmCode endpoint; the client
     * merges the content into its active circuit.
     *
     * <p>The optional {@code fileId} names the file the code is being edited in. It is what
     * {@code include "..."} statements resolve against; without it the request stays purely
     * content-only and only the built-in standard libraries can be included.
     */
    @PostMapping(value = "/parse", consumes = MediaType.TEXT_PLAIN_VALUE)
    @PreAuthorize("isAuthenticated()")
    public CircuitContentResponse parseQasmCode(
        @RequestBody String qasmCode,
        @RequestParam(required = false) String fileId,
        Authentication authentication
    ) {
        log.debug("REST request to parse code into circuit content. fileId={}", fileId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = qasmService.parse(qasmCode, fileId, includeResolver.forUser(user));
        return new CircuitContentResponse(
            circuit.getRegisters().stream().map(registerDtoMapper::toResponse).toList(),
            circuit.getLayers().stream().map(layerDtoMapper::toResponse).toList(),
            loopBlockDtoMapper.toResponses(circuit.getLoopBlocks())
        );
    }

    /** Maps the request's registers to domain models, tolerating a missing (null) registers field. */
    private List<Register> toRegisters(UpdateCircuitRequest request) {
        return Optional.ofNullable(request.registers()).orElseGet(List::of).stream().map(registerDtoMapper::toDomain).toList();
    }

    /** Maps the request's layers to domain models, tolerating a missing (null) layers field. */
    private List<Layer> toLayers(UpdateCircuitRequest request) {
        return Optional.ofNullable(request.layers()).orElseGet(List::of).stream().map(layerDtoMapper::toDomain).toList();
    }

    /**
     * Maps the request's repetition frames, tolerating a missing (null) field.
     *
     * <p>Missing means none: this is a full-replace endpoint, so a client that does not send frames
     * removes them, exactly as it would by omitting a layer.
     */
    private List<LoopBlock> toLoopBlocks(UpdateCircuitRequest request) {
        return Optional.ofNullable(request.loopBlocks()).orElseGet(List::of).stream().map(loopBlockDtoMapper::toDomain).toList();
    }

    /**
     * Resets a specific circuit (deletes it, creates a fresh one with the same
     * projectId and fileId).
     * Ownership is verified via the circuit's associated project.
     */
    @DeleteMapping("/{circuitId}/reset")
    @PreAuthorize("isAuthenticated()")
    public CircuitResponse reset(@PathVariable String circuitId, Authentication authentication) {
        log.info("REST request to reset a specific circuit");
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        QuantumCircuit circuit = service.resetCircuit(circuitId, user);
        return toResponse(circuit, user);
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
        return toResponse(circuit, user);
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
        return toResponse(circuit, user);
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
        return toResponse(circuit, user);
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
        return toResponse(circuit, user);
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
        return toResponse(circuit, user);
    }
}
