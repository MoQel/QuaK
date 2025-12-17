package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = { RegisterJpaMapper.class })
public interface CircuitJpaMapper {
    JpaQuantumCircuit toEntity(QuantumCircuit domain);

    List<JpaRegister> toEntity(List<Register> value);

    QuantumCircuit toDomain(JpaQuantumCircuit entity);

    List<Register> toDomain(List<JpaRegister> value);
}
