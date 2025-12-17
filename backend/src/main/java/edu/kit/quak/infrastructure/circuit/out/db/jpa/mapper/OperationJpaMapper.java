package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaQuantumOperation;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface OperationJpaMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGate.class, target = JpaElementaryQuantumGate.class)
    JpaQuantumOperation toEntity(QuantumOperation domain);

    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = JpaElementaryQuantumGate.class, target = ElementaryQuantumGate.class)
    QuantumOperation toDomain(JpaQuantumOperation entity);
}
