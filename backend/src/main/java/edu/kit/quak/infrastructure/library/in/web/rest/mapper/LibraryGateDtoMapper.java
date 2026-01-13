package edu.kit.quak.infrastructure.library.in.web.rest.mapper;

import edu.kit.quak.core.library.model.Gate;
import edu.kit.quak.infrastructure.library.in.web.rest.dto.LibraryGateResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface LibraryGateDtoMapper {

    LibraryGateResponse toResponse(Gate gate);

    List<LibraryGateResponse> toResponseList(List<Gate> gates);
}