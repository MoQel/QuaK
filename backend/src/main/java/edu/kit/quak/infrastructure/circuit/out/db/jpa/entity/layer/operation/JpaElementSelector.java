package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import jakarta.persistence.Column;
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
    @JoinColumn(name = "quantum_operation_target_id", referencedColumnName = "id")
    private JpaQuantumOperation quantumOperationTarget;

    @ManyToOne
    @JoinColumn(name = "quantum_operation_control_id", referencedColumnName = "id")
    private JpaQuantumOperation quantumOperationControl;

    @ManyToOne
    @JoinColumn(name = "measurement_id", referencedColumnName = "id")
    private JpaMeasurement measurement;

    private String registerId;

    @Column(name = "register_index")
    private int index;
}
