package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaClassicRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RegisterMapper {
    @Mapping(target = "circuit", ignore = true)
    JpaQuantumRegister toEntity(QuantumRegister domain);

    @Mapping(target = "circuit", ignore = true)
    JpaClassicRegister toEntity(ClassicRegister domain);

    QuantumRegister toDomain(JpaQuantumRegister entity);

    ClassicRegister toDomain(JpaClassicRegister entity);
}
