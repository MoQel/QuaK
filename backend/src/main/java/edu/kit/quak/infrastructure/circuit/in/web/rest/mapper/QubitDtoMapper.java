package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QubitResponse;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { GateDtoMapper.class })
public interface QubitDtoMapper {
    @Mapping(target = "gates", source = "operations")
    QubitResponse toResponse(Qubit qubit);
}
