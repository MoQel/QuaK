package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {RegisterJpaMapper.class, LayerJpaMapper.class})
public interface CircuitJpaMapper {
    @Mapping(target = "id", source = "id")
    JpaQuantumCircuit toEntity(QuantumCircuit domain);

    List<JpaRegister> mapRegisterListToEntity(List<Register> value);

    List<JpaLayer> mapLayerListToEntity(List<Layer> value);

    @Mapping(target = "id", source = "id")
    QuantumCircuit toDomain(JpaQuantumCircuit entity);

    List<Register> mapRegisterListToDomain(List<JpaRegister> value);

    List<Layer> mapLayerListToDomain(List<JpaLayer> value);

    @AfterMapping
    default void linkRegistersAndLayers(@MappingTarget JpaQuantumCircuit entity) {
        if (entity.getRegisters() != null) {
            entity.getRegisters().forEach(reg -> reg.setCircuit(entity));
        }
        if (entity.getLayers() != null) {
            entity.getLayers().forEach(lay -> lay.setCircuit(entity));
        }
    }
}
