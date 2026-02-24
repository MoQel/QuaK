package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.JpaLayer;
import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register.JpaRegister;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class JpaQuantumCircuit extends JpaElementWithId {

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "register_pos")
    private List<JpaRegister> registers = new ArrayList<>();

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "layer_pos")
    private List<JpaLayer> layers = new ArrayList<>();
}
