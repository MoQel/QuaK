package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaQubit;
import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "operation_type", discriminatorType = DiscriminatorType.STRING)
public abstract class JpaQuantumOperation extends JpaElementWithId {
    @ManyToOne
    @JoinColumn(name = "qubit_id", referencedColumnName = "id")
    private JpaQubit qubit;

    public JpaQubit getQubit() {
        return qubit;
    }

    public void setQubit(JpaQubit qubit) {
        this.qubit = qubit;
    }
}
