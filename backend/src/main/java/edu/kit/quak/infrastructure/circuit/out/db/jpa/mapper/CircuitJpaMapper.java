package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import java.util.List;
import org.mapstruct.*;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    collectionMappingStrategy = CollectionMappingStrategy.TARGET_IMMUTABLE,
    uses = { RegisterJpaMapper.class }
)
public interface CircuitJpaMapper {
    @Mapping(target = "id", source = "id")
    JpaQuantumCircuit toEntity(QuantumCircuit domain);

    List<JpaRegister> toEntity(List<Register> value);

    @Mapping(target = "id", source = "id")
    QuantumCircuit toDomain(JpaQuantumCircuit entity);

    List<Register> toDomain(List<JpaRegister> value);

    @AfterMapping
    default void linkRegisters(@MappingTarget JpaQuantumCircuit entity) {
        if (entity.getRegisters() != null) {
            entity.getRegisters().forEach(reg -> reg.setCircuit(entity));
        }
    }
}
