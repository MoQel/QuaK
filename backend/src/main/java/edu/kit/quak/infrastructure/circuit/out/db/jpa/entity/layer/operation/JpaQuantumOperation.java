package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "operation_type", discriminatorType = DiscriminatorType.STRING)
public abstract class JpaQuantumOperation extends JpaElementWithId {
    @ManyToOne
    @JoinColumn(name = "layer_id", referencedColumnName = "id")
    protected JpaLayer layer;

    @Enumerated(EnumType.STRING)
    protected QuantumOperationLibrary operationDefinition;

    protected boolean inverseForm;

    @ElementCollection(fetch = FetchType.EAGER)
    protected List<JpaElementSelector> targetQubits;

    @ElementCollection(fetch = FetchType.EAGER)
    protected List<JpaElementSelector> controlQubits;
}
