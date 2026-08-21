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

    private String projectId;

    private String fileId;

    /**
     * Whether the circuit is offered as a building block elsewhere in the project.
     *
     * <p>Deliberately the wrapper type: ddl-auto adds the column without a default, so rows written
     * before this existed hold NULL. A primitive would fail to read them; the mapper reads NULL as
     * "not offered", which is the right answer for a circuit nobody ever declared to be one.
     */
    private Boolean offeredAsSubcircuit;

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "register_pos")
    private List<JpaRegister> registers = new ArrayList<>();

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "layer_pos")
    private List<JpaLayer> layers = new ArrayList<>();
}
