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

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "register_pos")
    private List<JpaRegister> registers = new ArrayList<>();

    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "layer_pos")
    private List<JpaLayer> layers = new ArrayList<>();

    /**
     * Repetition frames. Bidirectional like the other two — a unidirectional {@code @JoinColumn}
     * here is what silently dropped a composite gate's body on every autosave.
     */
    @OneToMany(mappedBy = "circuit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "loop_block_pos")
    private List<JpaLoopBlock> loopBlocks = new ArrayList<>();
}
