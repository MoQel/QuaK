package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;

import java.util.ArrayList;
import java.util.List;

public class QuantumCircuit extends ElementWithId {
    public static final String REGISTER_PREFIX = "q";

    private final List<Register> registers = new ArrayList<>();

    public QuantumCircuit() {
        super();
    }

    public List<Register> getRegisters() {
        return registers;
    }

    public QuantumRegister addQuantumRegister() {
        int nextIndex = registers.stream()
                .map(Register::getName)
                .filter(name -> name.startsWith(REGISTER_PREFIX))
                .map(name -> name.substring(REGISTER_PREFIX.length()))
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(-1) + 1;
        QuantumRegister register = new QuantumRegister(REGISTER_PREFIX + nextIndex);
        registers.add(register);
        return register;
    }

    public void deleteQuantumRegister(String registerId) {
        for (Register register : registers) {
            if (register.getId().equals(registerId)) {
                registers.remove(register);
                return;
            }
        }
    }
}
