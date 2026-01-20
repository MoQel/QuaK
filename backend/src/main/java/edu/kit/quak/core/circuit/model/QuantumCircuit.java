package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
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
        registers.removeIf(register ->
                register.asQuantum()
                        .map(qReg -> !qReg.getQubits().isEmpty() && qReg.getQubits().getFirst().getId().equals(qubitId))
                        .orElse(false)
        );
    }

    public void addQubit() {
        QuantumRegister register = addQuantumRegister();
        register.addQubit();
    }

    public void changeQubitName(String qubitId, String name) {
        for (Register register : registers) {
            register.asQuantum().ifPresent(qReg -> {
                boolean qubitFound = qReg.getQubits().stream()
                        .anyMatch(qubit -> qubit.getId().equals(qubitId));

                if (qubitFound) {
                    qReg.setName(name);
                }
            });
        }
    }

    public void addElementaryQuantumGate(ElementaryQuantumGateDefinitionIdentifier definitionId, int registerIdx, int positionIdx) {
        if (registerIdx < 0 || registerIdx >= registers.size()) {
            throw new IllegalArgumentException("Register index out of bounds: " + registerIdx);
        }

        registers.get(registerIdx).asQuantum().ifPresentOrElse(
                qReg -> qReg.addElementaryQuantumGate(definitionId, positionIdx),
                () -> {
                    throw new IllegalArgumentException(
                            String.format("Register at index %d is not a quantum register (cannot add gate).", registerIdx)
                    );
                }
        );
    }

    public void moveQuantumOperation(String operationId, int targetRegisterIdx, int positionIdx) {
        // search for tuple (Qubit, Operation)
        var location = findOperationLocation(operationId)
                .orElseThrow(() -> new IllegalArgumentException(String.format("Operation %s not found within circuit %s.", operationId, id)));

        Qubit sourceQubit = location.qubit();
        QuantumOperation operationToMove = location.operation();

        if (targetRegisterIdx < 0 || targetRegisterIdx >= registers.size()) {
            throw new IllegalArgumentException("Target register index out of bounds.");
        }

        QuantumRegister targetReg = registers.get(targetRegisterIdx).asQuantum()
                .orElseThrow(() -> new IllegalArgumentException("Target register is not a quantum register."));

        if (targetReg.getQubits().isEmpty()) {
            throw new IllegalStateException("Target register has no qubits.");
        }
      
        Qubit targetQubit = targetReg.getQubits().getFirst();

        sourceQubit.removeOperation(operationToMove);
        operationToMove.generateNewId(); //Generate new id because of orphan removal problems with Hibernate.
        targetQubit.addOperation(positionIdx, operationToMove);
    }

    public void deleteQuantumOperation(String operationId) {
        boolean removed = findOperationLocation(operationId)
                .map(loc -> {
                    loc.qubit().removeOperation(loc.operation());
                    return true;
                })
                .orElse(false);

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

    private record OperationLocation(Qubit qubit, QuantumOperation operation) {}

    private Optional<OperationLocation> findOperationLocation(String operationId) {
        return registers.stream()
                .flatMap(reg -> reg.asQuantum().stream())
                .flatMap(qReg -> qReg.getQubits().stream())
                .flatMap(qubit -> qubit.getOperations().stream()
                        .filter(op -> op.getId().equals(operationId))
                        .map(op -> new OperationLocation(qubit, op)))
                .findFirst();
    }
}
