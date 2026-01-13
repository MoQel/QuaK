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

    public void deleteQuantumRegister(String qubitId) {
        for (Register register : registers) {
            if (register instanceof QuantumRegister quantumRegister &&
                    quantumRegister.getQubits().getFirst().getId().equals(qubitId)) {
                registers.remove(register);
                return;
            }
        }
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("QuantumCircuit(id=").append(id).append(")\n");
        registers.forEach(reg -> sb.append("  ").append(reg.toString().replace("\n", "\n  ")).append("\n"));
        return sb.toString().trim();
    }
}
