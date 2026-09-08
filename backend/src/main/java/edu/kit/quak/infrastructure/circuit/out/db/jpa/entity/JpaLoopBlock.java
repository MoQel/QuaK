package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity;

import jakarta.persistence.*;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * A repetition frame over part of a circuit.
 *
 * <p>Stored beside the layers rather than inside one, because the operations it covers stay in their
 * layers — a frame annotates them, it does not contain them.
 *
 * <p>The members are kept as plain <em>ids</em>, not as an association to {@link
 * edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaQuantumOperation}. An
 * association would be the tidier schema, but it is the wrong shape here: an operation belongs to
 * its layer, and a join to it from the frame would make the two owners of the same row fight over
 * cascade and orphan removal on every full-replace save. Consistency is instead a domain rule
 * ({@code QuantumCircuit} refuses a frame naming an operation it does not contain, and drops members
 * that are deleted), and a save replaces layers and frames together.
 *
 * <p>The id list is an ordered collection: it is the loop body's program order, which is what code
 * generation emits inside the {@code for}.
 */
@Getter
@Setter
@Entity
public class JpaLoopBlock extends JpaElementWithId {

    @ManyToOne
    @JoinColumn(name = "circuit_id", referencedColumnName = "id")
    private JpaQuantumCircuit circuit;

    private int repeatCount;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "loop_block_operations", joinColumns = @JoinColumn(name = "loop_block_id"))
    @OrderColumn(name = "member_position")
    @Column(name = "operation_id")
    private List<String> operationIds;
}
