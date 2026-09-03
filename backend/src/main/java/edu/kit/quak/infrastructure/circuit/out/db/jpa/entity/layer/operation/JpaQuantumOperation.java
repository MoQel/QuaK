package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import jakarta.persistence.*;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "operation_type", discriminatorType = DiscriminatorType.STRING)
public abstract class JpaQuantumOperation extends JpaElementWithId {

    @ManyToOne
    @JoinColumn(name = "layer_id", referencedColumnName = "id")
    protected JpaLayer layer;

    /**
     * Set instead of {@link #layer} when this operation is part of a composite gate's body.
     *
     * <p>The association is deliberately bidirectional, mirroring layer↔operation: a unidirectional
     * {@code @OneToMany @JoinColumn} on the composite made Hibernate lose the whole body when a
     * circuit that already contained the gate was saved again (the layer's cascading delete and the
     * merge of the same operation id raced), which is exactly the autosave path.
     */
    @ManyToOne
    @JoinColumn(name = "composite_gate_id", referencedColumnName = "id")
    protected JpaCompositeQuantumGate compositeGate;

    /**
     * Position within {@link #compositeGate}'s body, i.e. program order. Stored explicitly rather
     * than via {@code @OrderColumn}: an order column is only maintained by the owning side, and the
     * owning side of this association has to be the child (see {@link #compositeGate}).
     */
    protected Integer bodyPosition;

    /**
     * Stored as a plain VARCHAR, not Hibernate's default native {@code ENUM('H','X',...)} column:
     * {@code ddl-auto=update} never alters an existing column, so on MariaDB every enum constant
     * added later (as {@code COMPOSITE} was) would fail existing databases with "Data truncated for
     * column" on insert — invisible on the dev H2, which starts from a fresh schema every time.
     * Databases created before this change need a one-time
     * {@code ALTER TABLE jpa_quantum_operation MODIFY COLUMN operation_definition varchar(32)}.
     */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 32)
    protected QuantumOperationLibrary operationDefinition;

    protected boolean inverseForm;

    @ElementCollection(fetch = FetchType.EAGER)
    protected List<JpaElementSelector> targetQubits;

    @ElementCollection(fetch = FetchType.EAGER)
    protected List<JpaElementSelector> controlQubits;
}
