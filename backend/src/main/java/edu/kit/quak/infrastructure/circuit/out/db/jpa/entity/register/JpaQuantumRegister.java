package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class JpaQuantumRegister extends JpaRegister {
    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JpaQubit> qubits = new ArrayList<>();

    public void setQubits(List<JpaQubit> qubits) {
        this.qubits = qubits;
    }

    public List<JpaQubit> getQubits() {
        return qubits;
    }
}
