package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.*;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * A call to a user-defined gate.
 *
 * <p>Only the call is stored: its name, its port labels and its body <em>as bound to this call's
 * qubits</em>. The definition itself is not a table of its own — it is rebuilt on load by inverting
 * that binding (see {@code CompositeQuantumGate.fromBoundBody}), which is possible because a call
 * cannot pass the same qubit twice. Two calls of the same gate therefore come back as two equal
 * definitions rather than one shared instance; nothing downstream depends on that identity.
 *
 * <p>Both collections are ordered lists rather than bags: parameter order decides which port a wire
 * belongs to, and body order is program order.
 */
@Getter
@Setter
@Entity
@DiscriminatorValue("COMPOSITE_GATE")
public class JpaCompositeQuantumGate extends JpaQuantumOperation {

    private String gateName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "composite_gate_port_labels", joinColumns = @JoinColumn(name = "operation_id"))
    @OrderColumn(name = "port_position")
    @Column(name = "port_label")
    private List<String> portLabels;

    /**
     * The gates this call is made of, one level deep. Bidirectional (see
     * {@link JpaQuantumOperation#compositeGate}) rather than a unidirectional join column, which
     * silently dropped the body when an already-stored circuit was saved again.
     */
    @OneToMany(mappedBy = "compositeGate", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("bodyPosition ASC")
    private List<JpaQuantumOperation> body;
}
