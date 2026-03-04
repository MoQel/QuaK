package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "register_type", discriminatorType = DiscriminatorType.STRING)
public abstract class JpaRegister extends JpaElementWithId {

    @ManyToOne
    @JoinColumn(name = "circuit_id", referencedColumnName = "id")
    protected JpaQuantumCircuit circuit;

    protected String name;
}
