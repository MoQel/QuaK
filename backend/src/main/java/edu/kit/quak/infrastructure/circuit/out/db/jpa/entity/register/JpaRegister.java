package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class JpaRegister extends JpaElementWithId {
    private String name;

    @ManyToOne
    private JpaQuantumCircuit circuit;

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
