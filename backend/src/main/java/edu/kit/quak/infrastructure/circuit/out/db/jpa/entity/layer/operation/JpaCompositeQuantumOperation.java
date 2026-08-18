package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@DiscriminatorValue("COMPOSITE_OPERATION")
public class JpaCompositeQuantumOperation extends JpaQuantumOperation {

    @Column(name = "definition_circuit_id")
    private String definitionCircuitId;
}
