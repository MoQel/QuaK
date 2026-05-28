package edu.kit.quak.core.circuit.model.register;

import java.util.Optional;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClassicRegister extends Register {

    private int numberOfBits;

    public ClassicRegister(String name, int numberOfBits) {
        super(name);
        this.numberOfBits = numberOfBits;
    }

    @Override
    public Optional<ClassicRegister> asClassic() {
        return Optional.of(this);
    }

    public void addBit() {
        numberOfBits++;
    }

    public void removeBit() {
        numberOfBits--;
    }

    @Override
    public String toString() {
        return "ClassicRegister %s with %d bits".formatted(getName(), numberOfBits);
    }
}
