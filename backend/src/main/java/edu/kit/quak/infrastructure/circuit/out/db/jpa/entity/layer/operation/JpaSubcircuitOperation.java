package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.*;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@DiscriminatorValue("SUBCIRCUIT_OPERATION")
public class JpaSubcircuitOperation extends JpaQuantumOperation {

    @Column(name = "definition_circuit_id")
    private String definitionCircuitId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "subcircuit_qubit_indices", joinColumns = @JoinColumn(name = "operation_id"))
    @OrderColumn(name = "position")
    @Column(name = "subcircuit_qubit_index")
    private List<Integer> subcircuitQubitIndices;
}
