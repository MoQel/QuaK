package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.*;
import java.util.List;
import org.mapstruct.*;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    uses = ElementSelectorDtoMapper.class,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface QuantumOperationDtoMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGate.class, target = ElementaryQuantumGateDto.class)
    @SubclassMapping(source = Measurement.class, target = MeasurementDto.class)
    @SubclassMapping(source = CompositeQuantumGate.class, target = CompositeQuantumGateDto.class)
    @Mapping(target = "identifier", source = "operationDefinition")
    QuantumOperationDto toResponse(QuantumOperation domain);

    /**
     * Hand-written because a composite does not follow the shape the generated mapping assumes: its
     * {@code identifier} is the gate's own name rather than the {@code COMPOSITE} library constant,
     * and the port labels, used positions and body are derived from the definition instead of being
     * plain properties. The body is expanded one level, so a nested gate stays a nested composite.
     */
    default CompositeQuantumGateDto toResponse(CompositeQuantumGate domain) {
        if (domain == null) {
            return null;
        }
        return new CompositeQuantumGateDto(
            domain.getId(),
            domain.getGateName(),
            domain.isInverseForm(),
            toSelectorDtos(domain.getTargetQubits()),
            toSelectorDtos(domain.getControlQubits()),
            domain.getDefinition().getParameterNames(),
            domain.getDefinition().getUsedParameterIndices(),
            domain.expand().stream().map(this::toResponse).toList()
        );
    }

    List<ElementSelectorDto> toSelectorDtos(List<ElementSelector> selectors);

    /**
     * Maps an operation DTO back to the domain. Provided ids are kept so operations
     * have a stable identity across full-replace saves (analogous to registers);
     * missing ids fall back to the freshly generated one.
     */
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGateDto.class, target = ElementaryQuantumGate.class)
    @SubclassMapping(source = MeasurementDto.class, target = Measurement.class)
    @SubclassMapping(source = CompositeQuantumGateDto.class, target = CompositeQuantumGate.class)
    @Mapping(target = "operationDefinition", source = "identifier")
    QuantumOperation toDomain(QuantumOperationDto request);

    /**
     * Hand-written for the same reason as the response direction: the gate name lives in
     * {@code identifier} and the definition is rebuilt rather than mapped field by field.
     *
     * <p>The DTO carries the body bound to this call's qubits, not the definition's formal body —
     * {@link CompositeQuantumGate#fromBoundBody} inverts that binding. The id is taken from the
     * request so an operation keeps its identity across the frontend's full-replace saves, exactly
     * like the generated mappings do for the other operation types.
     */
    default CompositeQuantumGate toDomain(CompositeQuantumGateDto request) {
        if (request == null) {
            return null;
        }
        CompositeQuantumGate call = CompositeQuantumGate.fromBoundBody(
            request.getIdentifier(),
            request.getPortLabels(),
            request.isInverseForm(),
            toSelectors(request.getTargetQubits()),
            request.getBody() == null ? List.of() : request.getBody().stream().map(this::toDomain).toList()
        );
        if (request.getId() != null) {
            call.setId(request.getId());
        }
        return call;
    }

    List<ElementSelector> toSelectors(List<ElementSelectorDto> selectors);
}
