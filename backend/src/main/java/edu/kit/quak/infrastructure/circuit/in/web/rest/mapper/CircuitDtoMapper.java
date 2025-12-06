package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CircuitDtoMapper {
    @Mapping(target = "qubits", source = "quantumCircuit.registers")
    CircuitResponse toResponse(QuantumCircuit quantumCircuit);
}