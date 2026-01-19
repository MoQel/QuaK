package edu.kit.quak.infrastructure.library.in.web.rest.mapper;

import edu.kit.quak.core.library.model.Gate;
import edu.kit.quak.infrastructure.library.in.web.rest.dto.GateResponse;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface GateDtoMapper {

    GateResponse toResponse(Gate gate);

    List<GateResponse> toResponseList(List<Gate> gates);
}
