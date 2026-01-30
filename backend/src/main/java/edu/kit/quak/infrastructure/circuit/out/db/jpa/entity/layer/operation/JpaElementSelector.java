package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class JpaElementSelector extends JpaElementWithId {
    @ManyToOne
    @JoinColumn(name = "quantum_operation_id", referencedColumnName = "id")
    protected JpaQuantumOperation quantumOperation;

    protected String registerId;

    private int index;
}
