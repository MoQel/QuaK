package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Embeddable
public class JpaElementSelector {
    private String registerId;

    @Column(name = "qubit_index")
    private int index;
}
