package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.GateResponse;
import org.mapstruct.*;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GateDtoMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGate.class, target = GateResponse.class)
    GateResponse toResponse(QuantumOperation operation);
}
