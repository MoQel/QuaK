package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = { RegisterJpaMapper.class })
public interface CircuitJpaMapper {
    JpaQuantumCircuit toEntity(QuantumCircuit domain);

    QuantumCircuit toDomain(JpaQuantumCircuit entity);
}
