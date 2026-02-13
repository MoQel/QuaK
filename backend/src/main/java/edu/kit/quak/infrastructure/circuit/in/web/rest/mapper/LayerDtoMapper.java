package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.LayerResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {QuantumOperationDtoMapper.class})
public interface LayerDtoMapper {
    LayerResponse toResponse(Layer layer);
}
