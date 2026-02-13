package edu.kit.quak.core.circuit.model.register;

import java.util.Optional;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuantumRegister extends Register {
    private int numberOfQubits;

    public QuantumRegister(String name, int numberOfQubits) {
        super(name);
        this.numberOfQubits = numberOfQubits;
    }

    @Override
    public Optional<QuantumRegister> asQuantum() {
        return Optional.of(this);
    }

    public void addQubit() {
        numberOfQubits++;
    }

    public void removeQubit() {
        numberOfQubits--;
    }

    @Override
    public String toString() {
        return "QuantumRegister %s with %d qubits".formatted(getName(), numberOfQubits);
    }
}
