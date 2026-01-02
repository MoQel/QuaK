package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaElementWithId;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.operation.JpaQuantumOperation;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class JpaQubit extends JpaElementWithId {
    @ManyToOne
    @JoinColumn(name = "register_id", referencedColumnName = "id")
    private JpaQuantumRegister register;

    @OneToMany(mappedBy = "qubit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "position")
    private List<JpaQuantumOperation> operations = new ArrayList<>();

    public List<JpaQuantumOperation> getOperations() {
        return operations;
    }

    public void setOperations(List<JpaQuantumOperation> operations) {
        this.operations = operations;
    }

    public JpaQuantumRegister getRegister() {
        return register;
    }

    public void setRegister(JpaQuantumRegister register) {
        this.register = register;
    }
}
