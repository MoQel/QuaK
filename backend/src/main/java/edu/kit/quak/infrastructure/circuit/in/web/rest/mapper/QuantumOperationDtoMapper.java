package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.*;
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
    @Mapping(target = "identifier", source = "operationDefinition")
    QuantumOperationDto toResponse(QuantumOperation domain);

    /**
     * Maps an operation DTO back to the domain. Provided ids are kept so operations
     * have a stable identity across full-replace saves (analogous to registers);
     * missing ids fall back to the freshly generated one.
     */
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGateDto.class, target = ElementaryQuantumGate.class)
    @SubclassMapping(source = MeasurementDto.class, target = Measurement.class)
    @Mapping(target = "operationDefinition", source = "identifier")
    QuantumOperation toDomain(QuantumOperationDto request);
}
