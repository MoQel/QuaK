package edu.kit.quak.infrastructure.circuit.in.web.rest.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.GateResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.QubitResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public abstract class CircuitDtoMapper {
    public CircuitResponse toResponse(QuantumCircuit circuit) {
        List<Qubit> qubits = circuit.getRegisters().stream().
                filter(QuantumRegister.class::isInstance)
                .map(QuantumRegister.class::cast)
                .map(register -> register.getQubits().getFirst())
                .toList();
        return toResponse(circuit.getId(), qubits);
    }

    abstract CircuitResponse toResponse(String id, List<Qubit> qubits);

    @Mapping(target = "gates", source = "operations")
    abstract QubitResponse toResponse(Qubit qubit);

    abstract GateResponse toResponse(ElementaryQuantumGate gate);
}