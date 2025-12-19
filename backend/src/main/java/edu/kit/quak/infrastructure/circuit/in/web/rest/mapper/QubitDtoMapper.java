package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QubitResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = { GateDtoMapper.class })
public interface QubitDtoMapper {

    @Mapping(target = "gates", source = "qubit.operations")
    @Mapping(target = "name", source = "registerName")
    QubitResponse toResponse(Qubit qubit, String registerName);
}
