package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.core.circuit.model.register.Register;

import java.util.*;

public class QuantumCircuit extends ElementWithId {
    public static final String REGISTER_PREFIX = "q";

    private List<Register> registers = new ArrayList<>();

    public QuantumCircuit() {
        super();
    }

    public List<Register> getRegisters() {
        return Collections.unmodifiableList(registers);
    }

    public void setRegisters(List<Register> registers) {
        this.registers = registers;
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
            if (register.getQubits().getFirst().getId().equals(qubitId)) {
                registers.remove(register);
                return;
            }
        }
    }

    public void addQubit() {
        QuantumRegister register = addQuantumRegister();
        register.addQubit();
    }

    public void changeQubitName(String qubitId, String name) {
        for (Register register : registers) {
            Optional<Qubit> found = register.getQubits().stream()
                    .filter(qubit -> qubit.getId().equals(qubitId))
                    .findFirst();
            if (found.isPresent()) {
                register.setName(name);
                break;
            }
        }
    }

    public void addElementaryQuantumGate(ElementaryQuantumGateType type, int qubitIdx, int positionIdx) {
        registers.get(qubitIdx).addElementaryQuantumGate(type, positionIdx);
    }

    public void moveQuantumOperation(String operationId, int targetQubitIdx, int positionIdx) {
        QuantumOperation operationToMove = null;
        Qubit sourceQubit = null;

        for (Register register : registers) {
            for (Qubit qubit : register.getQubits()) {
                Optional<QuantumOperation> found = qubit.getOperations().stream()
                        .filter(Objects::nonNull)
                        .filter(op -> op.getId().equals(operationId))
                        .findFirst();
                if (found.isPresent()) {
                    operationToMove = found.get();
                    sourceQubit = qubit;
                    break;
                }
            }
            if (operationToMove != null) break;
        }

        if (operationToMove == null) {
            throw new IllegalArgumentException(String.format("Operation %s not found within circuit %s.", operationId, id));
        }

        Qubit targetQubit = registers.get(targetQubitIdx).getQubits().getFirst();

        sourceQubit.removeOperation(operationToMove);
        operationToMove.generateNewId(); //Generate new id because of orphan removal problems with Hibernate.
        targetQubit.addOperation(positionIdx, operationToMove);
    }

    public void deleteQuantumOperation(String operationId) {
        boolean removed = false;
        for (Register register : registers) {
            for (Qubit qubit : register.getQubits()) {
                Optional<QuantumOperation> operationToRemove = qubit.getOperations().stream()
                        .filter(operation -> operation.getId().equals(operationId))
                        .findFirst();
                if (operationToRemove.isPresent()) {
                    qubit.removeOperation(operationToRemove.get());
                    removed = true;
                    break;
                }
            }
        }
        if (!removed) {
            throw new IllegalArgumentException(String.format("Operation %s not found within circuit %s.", operationId, id));
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
