package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaElementaryQuantumGate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface OperationMapper {
    @Mapping(target = "qubit", ignore = true)
    JpaElementaryQuantumGate toEntity(ElementaryQuantumGate domain);

    ElementaryQuantumGate toDomain(JpaElementaryQuantumGate entity);
}
