package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "register_type", discriminatorType = DiscriminatorType.STRING)
public abstract class JpaRegister extends JpaElementWithId {

    protected String name;

    @ManyToOne
    @JoinColumn(name = "circuit_id", referencedColumnName = "id")
    protected JpaQuantumCircuit circuit;

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public JpaQuantumCircuit getCircuit() {
        return circuit;
    }

    public void setCircuit(JpaQuantumCircuit circuit) {
        this.circuit = circuit;
    }
}
