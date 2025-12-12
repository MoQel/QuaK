package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class JpaQuantumCircuit extends JpaElementWithId{
    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JpaRegister> registers = new ArrayList<>();

    public List<JpaRegister> getRegisters() {
        return registers;
    }
}