package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@DiscriminatorValue("CLASSIC")
public class JpaClassicRegister extends JpaRegister {

    private int numberOfBits;
}
