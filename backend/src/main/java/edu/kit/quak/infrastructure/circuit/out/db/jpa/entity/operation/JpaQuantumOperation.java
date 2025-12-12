package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class JpaQuantumOperation extends JpaElementWithId {
}
