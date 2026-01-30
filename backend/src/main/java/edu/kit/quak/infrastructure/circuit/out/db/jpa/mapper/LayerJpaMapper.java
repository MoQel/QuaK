package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;


import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        collectionMappingStrategy = CollectionMappingStrategy.TARGET_IMMUTABLE,
        nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT,
        uses = {QuantumOperationJpaMapper.class})
public interface LayerJpaMapper {
    @Mapping(target = "id", source = "id")
    @Mapping(target = "circuit", ignore = true)
    JpaLayer toEntity(Layer domain);

    @Mapping(target = "id", source = "id")
    Layer toDomain(JpaLayer entity);

    @AfterMapping
    default void linkQuantumOperations(@MappingTarget JpaLayer entity) {
        if (entity.getQuantumOperations() != null) {
            entity.getQuantumOperations().forEach(reg -> reg.setLayer(entity));
        }
    }
}
