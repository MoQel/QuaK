package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaCircuit;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CircuitJpaMapper {
    QuantumCircuit toDomainEntity(JpaCircuit jpaCircuit);
}
