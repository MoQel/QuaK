package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("CLASSIC")
public class JpaClassicRegister extends JpaRegister {

    @ElementCollection
    @CollectionTable
    private List<Boolean> bits = new ArrayList<>();

    public void setBits(List<Boolean> bits) {
        this.bits = bits;
    }

    public List<Boolean> getBits() {
        return bits;
    }
}
