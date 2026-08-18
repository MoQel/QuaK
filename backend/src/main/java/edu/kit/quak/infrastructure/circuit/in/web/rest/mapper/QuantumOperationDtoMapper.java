package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.*;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = ElementSelectorDtoMapper.class)
public interface QuantumOperationDtoMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGate.class, target = ElementaryQuantumGateDto.class)
    @SubclassMapping(source = Measurement.class, target = MeasurementDto.class)
    @SubclassMapping(source = CompositeQuantumOperation.class, target = CompositeQuantumOperationDto.class)
    @Mapping(target = "identifier", ignore = true)
    QuantumOperationDto toResponse(QuantumOperation domain);

    @Mapping(target = "identifier", source = "operationDefinition")
    ElementaryQuantumGateDto toResponse(ElementaryQuantumGate domain);

    @Mapping(target = "identifier", source = "operationDefinition")
    MeasurementDto toResponse(Measurement domain);

    @Mapping(target = "identifier", ignore = true)
    CompositeQuantumOperationDto toResponse(CompositeQuantumOperation domain);

    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGateDto.class, target = ElementaryQuantumGate.class)
    @SubclassMapping(source = MeasurementDto.class, target = Measurement.class)
    @SubclassMapping(source = CompositeQuantumOperationDto.class, target = CompositeQuantumOperation.class)
    @Mapping(target = "id", ignore = true)
    QuantumOperation toDomain(QuantumOperationDto request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "operationDefinition", source = "identifier")
    ElementaryQuantumGate toDomain(ElementaryQuantumGateDto request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "operationDefinition", source = "identifier")
    Measurement toDomain(MeasurementDto request);

    @Mapping(target = "id", ignore = true)
    CompositeQuantumOperation toDomain(CompositeQuantumOperationDto request);
}
