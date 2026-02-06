package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaQuantumOperation;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
public class JpaLayer extends JpaElementWithId {
    @ManyToOne
    @JoinColumn(name = "circuit_id", referencedColumnName = "id")
    private JpaQuantumCircuit circuit;

    @OneToMany(mappedBy = "layer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JpaQuantumOperation> quantumOperations;
}
