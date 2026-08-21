package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaLoopBlock;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import java.util.ArrayList;
import java.util.List;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { RegisterJpaMapper.class, LayerJpaMapper.class })
public interface CircuitJpaMapper {
    @Mapping(target = "id", source = "id")
    JpaQuantumCircuit toEntity(QuantumCircuit domain);

    List<JpaRegister> mapRegisterListToEntity(List<Register> value);

    List<JpaLayer> mapLayerListToEntity(List<Layer> value);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "offeredAsSubcircuit", expression = "java(Boolean.TRUE.equals(entity.getOfferedAsSubcircuit()))")
    QuantumCircuit toDomain(JpaQuantumCircuit entity);

    List<Register> mapRegisterListToDomain(List<JpaRegister> value);

    List<Layer> mapLayerListToDomain(List<JpaLayer> value);

    /**
     * A frame carries no state beyond its repeat count and its members, so both directions are plain
     * field copies. The member ids are copied into a new list because the domain object owns its own
     * (it drops members when their operations are deleted), and it must not write into the entity's
     * managed collection while doing so.
     */
    default JpaLoopBlock mapLoopBlockToEntity(LoopBlock domain) {
        if (domain == null) {
            return null;
        }
        JpaLoopBlock entity = new JpaLoopBlock();
        entity.setId(domain.getId());
        entity.setRepeatCount(domain.getRepeatCount());
        entity.setOperationIds(new ArrayList<>(domain.getOperationIds()));
        return entity;
    }

    default LoopBlock mapLoopBlockToDomain(JpaLoopBlock entity) {
        if (entity == null) {
            return null;
        }
        LoopBlock domain = new LoopBlock(entity.getRepeatCount(), entity.getOperationIds() == null ? List.of() : entity.getOperationIds());
        domain.setId(entity.getId());
        return domain;
    }

    List<JpaLoopBlock> mapLoopBlockListToEntity(List<LoopBlock> value);

    List<LoopBlock> mapLoopBlockListToDomain(List<JpaLoopBlock> value);

    @AfterMapping
    default void linkRegistersAndLayers(@MappingTarget JpaQuantumCircuit entity) {
        if (entity.getRegisters() != null) {
            entity.getRegisters().forEach(reg -> reg.setCircuit(entity));
        }
        if (entity.getLayers() != null) {
            entity.getLayers().forEach(lay -> lay.setCircuit(entity));
        }
        if (entity.getLoopBlocks() != null) {
            entity.getLoopBlocks().forEach(block -> block.setCircuit(entity));
        }
    }
}
