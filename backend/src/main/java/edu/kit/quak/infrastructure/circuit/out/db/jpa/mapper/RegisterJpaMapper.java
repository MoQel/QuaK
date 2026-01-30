package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaClassicRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQuantumRegister;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        collectionMappingStrategy = CollectionMappingStrategy.TARGET_IMMUTABLE)
public interface RegisterJpaMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = QuantumRegister.class, target = JpaQuantumRegister.class)
    @SubclassMapping(source = ClassicRegister.class, target = JpaClassicRegister.class)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "circuit", ignore = true)
    JpaRegister toEntity(Register domain);

    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = JpaQuantumRegister.class, target = QuantumRegister.class)
    @SubclassMapping(source = JpaClassicRegister.class, target = ClassicRegister.class)
    @Mapping(target = "id", source = "id")
    Register toDomain(JpaRegister entity);
}
