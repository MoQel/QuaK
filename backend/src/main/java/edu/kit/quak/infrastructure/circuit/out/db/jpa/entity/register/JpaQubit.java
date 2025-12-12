package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import jakarta.persistence.*;

@Entity
public class JpaQubit {
    @Id
    @GeneratedValue
    private String id;

    @ManyToOne
    private JpaQuantumRegister register;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public JpaQuantumRegister getRegister() {
        return register;
    }

    public void setRegister(JpaQuantumRegister register) {
        this.register = register;
    }
}
