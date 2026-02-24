package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.*;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@DiscriminatorValue("MEASUREMENT")
public class JpaMeasurement extends JpaQuantumOperation {

    @ElementCollection(fetch = FetchType.EAGER)
    private List<JpaElementSelector> classicBits;
}
