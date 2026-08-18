package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaCompositeQuantumOperation;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementSelector;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaMeasurement;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaQuantumOperation;
import java.util.List;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { ElementSelectorJpaMapper.class })
public interface QuantumOperationJpaMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGate.class, target = JpaElementaryQuantumGate.class)
    @SubclassMapping(source = Measurement.class, target = JpaMeasurement.class)
    @SubclassMapping(source = CompositeQuantumOperation.class, target = JpaCompositeQuantumOperation.class)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "layer", ignore = true)
    @Mapping(target = "operationDefinition", ignore = true)
    JpaQuantumOperation toEntity(QuantumOperation domain);

    @Mapping(target = "layer", ignore = true)
    JpaElementaryQuantumGate toEntity(ElementaryQuantumGate domain);

    @Mapping(target = "layer", ignore = true)
    JpaMeasurement toEntity(Measurement domain);

    @Mapping(target = "layer", ignore = true)
    @Mapping(target = "operationDefinition", ignore = true)
    JpaCompositeQuantumOperation toEntity(CompositeQuantumOperation domain);

    List<JpaElementSelector> toEntity(List<ElementSelector> value);

    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = JpaElementaryQuantumGate.class, target = ElementaryQuantumGate.class)
    @SubclassMapping(source = JpaMeasurement.class, target = Measurement.class)
    @SubclassMapping(source = JpaCompositeQuantumOperation.class, target = CompositeQuantumOperation.class)
    @Mapping(target = "id", source = "id")
    QuantumOperation toDomain(JpaQuantumOperation entity);

    ElementaryQuantumGate toDomain(JpaElementaryQuantumGate entity);

    Measurement toDomain(JpaMeasurement entity);

    CompositeQuantumOperation toDomain(JpaCompositeQuantumOperation entity);

    List<ElementSelector> toDomain(List<JpaElementSelector> value);
}
