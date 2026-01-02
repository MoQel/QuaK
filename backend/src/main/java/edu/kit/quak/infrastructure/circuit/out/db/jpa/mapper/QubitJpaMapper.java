package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQubit;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {OperationJpaMapper.class})
public interface QubitJpaMapper {
    @Mapping(target = "id", source = "id")
    JpaQubit toEntity(Qubit domain);

    @Mapping(target = "id", source = "id")
    Qubit toDomain(JpaQubit entity);

    @AfterMapping
    default void linkOperations(@MappingTarget JpaQubit entity) {
        if (entity.getOperations() != null) {
            entity.getOperations().forEach(op -> op.setQubit(entity));
        }
    }
}
