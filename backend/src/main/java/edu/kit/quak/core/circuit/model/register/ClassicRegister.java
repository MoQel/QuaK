package edu.kit.quak.core.circuit.model.register;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ClassicRegister extends Register {

    private List<Boolean> bits = new ArrayList<>();

    public ClassicRegister(String name) {
        super(name);
    }

    @Override
    public Optional<ClassicRegister> asClassic() {
        return Optional.of(this);
    }

    public List<Boolean> getBits() {
        return bits;
    }

    public void setBits(List<Boolean> bits) {
        this.bits = bits;
    }

    public void addBit(Boolean bit) {
        bits.add(bit);
    }
}
