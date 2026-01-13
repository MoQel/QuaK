package edu.kit.quak.application.circuit.services;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.circuit.ports.out.CircuitRepositoryPort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Qubit;
import edu.kit.quak.core.circuit.model.register.Register;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;

@Service
public class CircuitService implements CircuitServicePort {
    private final CircuitRepositoryPort repository;

    public CircuitService(CircuitRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public QuantumCircuit init() {
        QuantumCircuit circuit = new QuantumCircuit();
        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit get(String circuitId) {
        return repository.findById(circuitId).orElseThrow(EntityNotFoundException::new);
    }

    @Override
    public void delete(String circuitId) {
        repository.delete(circuitId);
    }

    @Override
    public QuantumCircuit addQubit(String circuitId) {
        QuantumCircuit circuit = get(circuitId);
        QuantumRegister register = circuit.addQuantumRegister();
        register.addQubit();
        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit changeQubitName(String circuitId, String qubitId, String name) {
        QuantumCircuit circuit = get(circuitId);
        for (Register register : circuit.getRegisters()) {
            if (register instanceof QuantumRegister quantumRegister) {
                Optional<Qubit> found = quantumRegister.getQubits().stream()
                        .filter(qubit -> qubit.getId().equals(qubitId))
                        .findFirst();
                if (found.isPresent()) {
                    register.setName(name);
                    break;
                }
            }
        }
        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit deleteQubit(String circuitId, String qubitId) {
        QuantumCircuit circuit = get(circuitId);
        circuit.deleteQuantumRegister(qubitId);
        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit addGate(String circuitId, ElementaryQuantumGateType type, int qubitIdx, int positionIdx) {
        QuantumCircuit circuit = get(circuitId);
        Register register = circuit.getRegisters().get(qubitIdx);
        if (register instanceof QuantumRegister quantumRegister) {
            Qubit qubit = quantumRegister.getQubits().getFirst();
            ElementaryQuantumGate gate = new ElementaryQuantumGate(type);
            qubit.addOperation(gate);
            repository.save(circuit);
            return circuit;
        }
        throw new IllegalArgumentException(String.format("Index %d is not is not a qubit.", qubitIdx));
    }

    @Override
    public QuantumCircuit moveGate(String circuitId, String gateId, int targetQubitIdx, int positionIdx) {
        QuantumCircuit circuit = get(circuitId);
        ElementaryQuantumGate gateToMove = null;
        Qubit sourceQubit = null;

        for (Register register : circuit.getRegisters()) {
            if (register instanceof QuantumRegister quantumRegister) {
                for (Qubit qubit : quantumRegister.getQubits()) {
                    Optional<QuantumOperation> found = qubit.getOperations().stream()
                            .filter(Objects::nonNull)
                            .filter(op -> op.getId().equals(gateId))
                            .findFirst();
                    if (found.isPresent() && found.get() instanceof ElementaryQuantumGate gate) {
                        gateToMove = gate;
                        sourceQubit = qubit;
                        break;
                    }
                }
            }
            if (gateToMove != null) break;
        }

        if (gateToMove == null) {
            throw new IllegalArgumentException(String.format("Gate %s not found within circuit %s.", gateId, circuitId));
        }

        if (targetQubitIdx >= circuit.getRegisters().size()) {
            throw new IllegalArgumentException("Invalid qubit index: " + targetQubitIdx);
        }
        Register targetReg = circuit.getRegisters().get(targetQubitIdx);
        if (!(targetReg instanceof QuantumRegister targetQuantumReg)) {
            throw new IllegalArgumentException(String.format("Index %d is not a quantum register.", targetQubitIdx));
        }
        Qubit targetQubit = targetQuantumReg.getQubits().getFirst();

        int oldIdx = sourceQubit.getOperations().indexOf(gateToMove);
        sourceQubit.getOperations().remove(oldIdx);
        sourceQubit.getOperations().removeIf(Objects::isNull);
        if (sourceQubit != targetQubit) {
            targetQubit.getOperations().removeIf(Objects::isNull);
        }

        int adjustedInsertIdx = positionIdx;
        if (sourceQubit == targetQubit && oldIdx < positionIdx) {
                adjustedInsertIdx--;
        }
        gateToMove.generateNewId(); //Generate new id because of orphan removal problems with Hibernate.
        targetQubit.getOperations().add(adjustedInsertIdx, gateToMove);

        repository.save(circuit);
        return circuit;
    }

    @Override
    public QuantumCircuit deleteGate(String circuitId, String gateId) {
        QuantumCircuit circuit = get(circuitId);
        for (Register register : circuit.getRegisters()) {
            if (register instanceof QuantumRegister quantumRegister) {
                for (Qubit qubit : quantumRegister.getQubits()) {
                    boolean removed = qubit.getOperations().removeIf(operation -> operation.getId().equals(gateId));
                    if (removed) {
                        repository.save(circuit);
                        return circuit;
                    }
                }
            }
        }
        throw new IllegalArgumentException(String.format("Gate %s not found within circuit %s.", gateId, circuitId));
    }
}
