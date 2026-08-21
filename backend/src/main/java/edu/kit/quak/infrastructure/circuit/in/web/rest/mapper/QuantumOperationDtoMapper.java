package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.common.exception.DomainRuleViolationException;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.*;
import java.util.List;
import java.util.Objects;
import org.mapstruct.*;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    uses = ElementSelectorDtoMapper.class,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface QuantumOperationDtoMapper {
    /**
     * The identifier is ignored on the base mapping because {@code operationDefinition} no longer
     * lives on {@link QuantumOperation}: only the operations that actually have a library definition
     * fill it, via the per-subclass mappings below.
     */
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGate.class, target = ElementaryQuantumGateDto.class)
    @SubclassMapping(source = Measurement.class, target = MeasurementDto.class)
    @SubclassMapping(source = CompositeQuantumOperation.class, target = CompositeQuantumOperationDto.class)
    @SubclassMapping(source = CompositeQuantumGate.class, target = CompositeQuantumGateDto.class)
    @Mapping(target = "identifier", ignore = true)
    QuantumOperationDto toResponse(QuantumOperation domain);

    @Mapping(target = "identifier", source = "operationDefinition")
    ElementaryQuantumGateDto toResponse(ElementaryQuantumGate domain);

    @Mapping(target = "identifier", source = "operationDefinition")
    MeasurementDto toResponse(Measurement domain);

    @Mapping(target = "identifier", ignore = true)
    CompositeQuantumOperationDto toResponse(CompositeQuantumOperation domain);

    /**
     * Hand-written because a composite does not follow the shape the generated mapping assumes: its
     * {@code identifier} is the gate's own name rather than a library constant,
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
    @SubclassMapping(source = CompositeQuantumOperationDto.class, target = CompositeQuantumOperation.class)
    @SubclassMapping(source = CompositeQuantumGateDto.class, target = CompositeQuantumGate.class)
    QuantumOperation toDomain(QuantumOperationDto request);

    @Mapping(target = "operationDefinition", source = "identifier")
    ElementaryQuantumGate toDomain(ElementaryQuantumGateDto request);

    @Mapping(target = "operationDefinition", source = "identifier")
    Measurement toDomain(MeasurementDto request);

    CompositeQuantumOperation toDomain(CompositeQuantumOperationDto request);

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
        // Without these checks a payload missing any of the three dies in a Lombok @NonNull check
        // deep inside the model — an unmapped NullPointerException, i.e. a 500 with no usable message.
        if (request.getIdentifier() == null || request.getPortLabels() == null || request.getTargetQubits() == null) {
            throw new DomainRuleViolationException(
                "A composite gate needs a name, its port labels and its qubits, but got name=%s, portLabels=%s, targetQubits=%s.".formatted(
                    request.getIdentifier(),
                    request.getPortLabels(),
                    request.getTargetQubits()
                )
            );
        }
        List<QuantumOperationDto> bodyDtos = request.getBody() == null ? List.of() : request.getBody();
        // A null entry would only surface as a NullPointerException further down; say so instead of
        // silently dropping it, which would quietly change what the gate does.
        // Not List.contains(null): an immutable List.of() throws a NullPointerException on that.
        if (bodyDtos.stream().anyMatch(Objects::isNull)) {
            throw new DomainRuleViolationException("The body of gate '%s' contains an empty operation.".formatted(request.getIdentifier()));
        }

        CompositeQuantumGate call = CompositeQuantumGate.fromBoundBody(
            request.getIdentifier(),
            request.getPortLabels(),
            request.isInverseForm(),
            toSelectors(request.getTargetQubits()),
            bodyDtos.stream().map(this::toDomain).toList()
        );
        if (request.getId() != null) {
            call.setId(request.getId());
        }
        return call;
    }

    List<ElementSelector> toSelectors(List<ElementSelectorDto> selectors);
}
