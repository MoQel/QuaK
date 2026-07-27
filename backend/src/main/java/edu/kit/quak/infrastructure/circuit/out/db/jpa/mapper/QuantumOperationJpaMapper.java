package edu.kit.quak.infrastructure.circuit.out.db.jpa.mapper;

import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaCompositeQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementSelector;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaElementaryQuantumGate;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaMeasurement;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaQuantumOperation;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { ElementSelectorJpaMapper.class })
public interface QuantumOperationJpaMapper {
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = ElementaryQuantumGate.class, target = JpaElementaryQuantumGate.class)
    @SubclassMapping(source = Measurement.class, target = JpaMeasurement.class)
    @SubclassMapping(source = CompositeQuantumGate.class, target = JpaCompositeQuantumGate.class)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "layer", ignore = true)
    JpaQuantumOperation toEntity(QuantumOperation domain);

    List<JpaElementSelector> toEntity(List<ElementSelector> value);

    /**
     * Hand-written: the persisted shape is the <em>call</em>, so the gate name and port labels come
     * from the definition and the body is stored bound to this call's qubits (which is what makes
     * rebuilding the definition on load possible).
     */
    default JpaCompositeQuantumGate toEntity(CompositeQuantumGate domain) {
        if (domain == null) {
            return null;
        }
        JpaCompositeQuantumGate entity = new JpaCompositeQuantumGate();
        entity.setId(domain.getId());
        entity.setOperationDefinition(domain.getOperationDefinition());
        entity.setInverseForm(domain.isInverseForm());
        entity.setTargetQubits(toEntity(domain.getTargetQubits()));
        entity.setControlQubits(toEntity(domain.getControlQubits()));
        entity.setGateName(domain.getGateName());
        entity.setPortLabels(new ArrayList<>(domain.getDefinition().getParameterNames()));

        List<JpaQuantumOperation> body = domain.expand().stream().map(this::toEntity).collect(Collectors.toCollection(ArrayList::new));
        // The child owns the association, so link it explicitly — as LayerJpaMapper does for a
        // layer's operations — and record program order, which the child also owns.
        for (int position = 0; position < body.size(); position++) {
            body.get(position).setCompositeGate(entity);
            body.get(position).setBodyPosition(position);
        }
        entity.setBody(body);
        return entity;
    }

    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    @SubclassMapping(source = JpaElementaryQuantumGate.class, target = ElementaryQuantumGate.class)
    @SubclassMapping(source = JpaMeasurement.class, target = Measurement.class)
    @SubclassMapping(source = JpaCompositeQuantumGate.class, target = CompositeQuantumGate.class)
    @Mapping(target = "id", source = "id")
    QuantumOperation toDomain(JpaQuantumOperation entity);

    /** Rebuilds the definition by inverting the stored binding; see {@link CompositeQuantumGate#fromBoundBody}. */
    default CompositeQuantumGate toDomain(JpaCompositeQuantumGate entity) {
        if (entity == null) {
            return null;
        }
        CompositeQuantumGate call = CompositeQuantumGate.fromBoundBody(
            entity.getGateName(),
            entity.getPortLabels(),
            entity.isInverseForm(),
            toDomain(entity.getTargetQubits()),
            entity.getBody() == null ? List.of() : entity.getBody().stream().map(this::toDomain).toList()
        );
        call.setId(entity.getId());
        return call;
    }

    List<ElementSelector> toDomain(List<JpaElementSelector> value);
}
