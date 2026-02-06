package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementSelector;
import org.mapstruct.CollectionMappingStrategy;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        collectionMappingStrategy = CollectionMappingStrategy.TARGET_IMMUTABLE)
public interface ElementSelectorJpaMapper {
    @Mapping(target = "id", source = "id")
    @Mapping(target = "quantumOperationTarget", ignore = true)
    @Mapping(target = "quantumOperationControl", ignore = true)
    @Mapping(target = "measurement", ignore = true)
    JpaElementSelector toEntity(ElementSelector domain);

    @Mapping(target = "id", source = "id")
    ElementSelector toDomain(JpaElementSelector entity);
}
