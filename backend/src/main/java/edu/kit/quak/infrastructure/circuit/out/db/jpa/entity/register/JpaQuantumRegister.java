package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class JpaQuantumRegister extends JpaRegister {
    private String name;

    @OneToMany(mappedBy = "register", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JpaQubit> qubits = new ArrayList<>();

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<JpaQubit> getQubits() {
        return qubits;
    }
}
