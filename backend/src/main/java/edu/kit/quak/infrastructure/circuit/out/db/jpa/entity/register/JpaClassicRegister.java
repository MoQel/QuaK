package edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.register;

import jakarta.persistence.Entity;

import java.util.ArrayList;
import java.util.List;

@Entity
public class JpaClassicRegister extends JpaRegister {
    private List<Boolean> bits = new ArrayList<>();

    public void setBits(List<Boolean> bits) {
        this.bits = bits;
    }

    public List<Boolean> getBits() {
        return bits;
    }
}
