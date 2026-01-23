package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.ElementWithId;
import java.util.Optional;

public abstract class Register extends ElementWithId {
    protected String name;

    protected Register(String name) {
        super();
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    /**
     * Capability Query: Is this a Quantum Register?
     *
     * @return Optional containing this if it is a QuantumRegister, empty otherwise.
     */
    public Optional<QuantumRegister> asQuantum() {
        return Optional.empty();
    }

    /**
     * Capability Query: Is this a Classic Register?
     *
     * @return Optional containing this if it is a ClassicRegister, empty otherwise.
     */
    public Optional<ClassicRegister> asClassic() {
        return Optional.empty();
    }
}
