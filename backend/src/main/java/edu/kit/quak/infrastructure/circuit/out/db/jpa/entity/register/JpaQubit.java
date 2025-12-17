package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaQuantumOperation;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class JpaQubit {
    @Id
    @GeneratedValue
    private String id;

    @ManyToOne
    private JpaQuantumRegister register;

    @OneToMany
    private List<JpaQuantumOperation> operations = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<JpaQuantumOperation> getOperations() {
        return operations;
    }

    public void setOperations(List<JpaQuantumOperation> operations) {
        this.operations = operations;
    }
}
