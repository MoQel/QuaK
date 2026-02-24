package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@DiscriminatorValue("ELEMENTARY_GATE")
public class JpaElementaryQuantumGate extends JpaQuantumOperation {

    private double rotationAngle;
}
