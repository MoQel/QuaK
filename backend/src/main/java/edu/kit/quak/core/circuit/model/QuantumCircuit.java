package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;

import java.util.ArrayList;
import java.util.List;

public class QuantumCircuit extends ElementWithId {
    private final List<Register> registers = new ArrayList<>();

    public QuantumCircuit() {
        super();
    }

    public List<Register> getRegisters() {
        return registers;
    }

    public QuantumRegister addQuantumRegister() {
        QuantumRegister register = new QuantumRegister(String.format("q%d", registers.size()));
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
