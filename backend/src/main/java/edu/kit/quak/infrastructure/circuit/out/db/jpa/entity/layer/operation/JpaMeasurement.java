package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation;

import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@DiscriminatorValue("MEASUREMENT")
public class JpaMeasurement extends JpaQuantumOperation {
    @OneToMany(mappedBy = "quantumOperation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JpaElementSelector> classicBits;
}
