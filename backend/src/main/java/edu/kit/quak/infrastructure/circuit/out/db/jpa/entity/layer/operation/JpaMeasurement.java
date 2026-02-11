package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@DiscriminatorValue("MEASUREMENT")
public class JpaMeasurement extends JpaQuantumOperation {
    @ElementCollection(fetch = FetchType.EAGER)
    private List<JpaElementSelector> classicBits;
}
