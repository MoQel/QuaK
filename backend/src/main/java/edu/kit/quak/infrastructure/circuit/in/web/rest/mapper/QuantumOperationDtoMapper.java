package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.common.exception.DomainRuleViolationException;
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
     * Composites cannot be read back yet: the DTO carries the body already bound to this call's
     * qubits, which is what a client needs to draw the box but not enough to rebuild the
     * definition's formal body. Until the definition itself is part of the wire format (and has a
     * JPA counterpart), saving such a circuit fails here with a clear message instead of the
     * generated dispatch's "Not all subclasses are supported".
     */
    default CompositeQuantumGate toDomain(CompositeQuantumGateDto request) {
        throw new DomainRuleViolationException(
            "Saving a circuit that contains the user-defined gate '%s' is not supported yet.".formatted(request.getIdentifier())
        );
    }
}
