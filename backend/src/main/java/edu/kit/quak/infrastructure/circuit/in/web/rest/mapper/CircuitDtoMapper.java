package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {RegisterDtoMapper.class})
public interface CircuitDtoMapper {
    CircuitResponse toResponse(QuantumCircuit circuit);
}
