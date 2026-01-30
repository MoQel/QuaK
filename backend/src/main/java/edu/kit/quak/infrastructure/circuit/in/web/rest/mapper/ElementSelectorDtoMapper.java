package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.ElementSelectorDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ElementSelectorDtoMapper {
    ElementSelectorDto toResponse(ElementSelector domain);

    @Mapping(target = "id", ignore = true)
    ElementSelector toDomain(ElementSelectorDto response);
}