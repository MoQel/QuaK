package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class QuantumCircuitTest {

    public static final int INIT_QUBITS = 4;

    @Test
    void constructor_initializesRegisterAndLayer() {
        QuantumCircuit circuit = new QuantumCircuit();

        assertEquals(1, circuit.getRegisters().size());
        assertTrue(circuit.getRegisters().getFirst().asQuantum().isPresent());
        assertEquals(INIT_QUBITS, circuit.getRegisters().getFirst().asQuantum().get().getNumberOfQubits());
        assertEquals(0, circuit.getLayers().size());

        assertInstanceOf(QuantumRegister.class, circuit.getRegisters().getFirst());
    }

    @Test
    void addAndRemoveQubit() {
        QuantumCircuit circuit = new QuantumCircuit();
        QuantumRegister qr = circuit.getRegisters().getFirst().asQuantum().orElseThrow();

        circuit.addQubit(qr.getId());
        circuit.addQubit(qr.getId());
        assertEquals(INIT_QUBITS + 2, qr.getNumberOfQubits());

        circuit.removeQubit(qr.getId(), 0);
        assertEquals(INIT_QUBITS + 1, qr.getNumberOfQubits());
    }

    @Test
    void removeQubit_removesAffectedOperations() {
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        ElementSelector control = new ElementSelector(registerId, 0);
        ElementSelector target = new ElementSelector(registerId, 1);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.CX,false, List.of(target), List.of(control), 0d);

        circuit.addQuantumOperation(op, 0);
        assertEquals(1, circuit.getLayers().getFirst().getQuantumOperations().size());

        circuit.removeQubit(registerId, 0);

        assertTrue(circuit.getLayers().isEmpty());
    }

    @Test
    void addQuantumOperation_createsNewLayerIfNecessary() {
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();
        ElementSelector target = new ElementSelector(registerId, 1);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.T,false, List.of(target), List.of(), 0d);

        circuit.addQuantumOperation(op, 0);

        assertEquals(1, circuit.getLayers().size());
        assertTrue(circuit.getLayers().getFirst().getQuantumOperations().contains(op));
    }

    @Test
    void moveQuantumOperation_changesLayerAndSelectors() {
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        ElementSelector target = new ElementSelector(registerId, 0);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.S,false, List.of(target), List.of(), 0d);

        circuit.addQuantumOperation(op, 0);
        circuit.moveQuantumOperation(op.getId(), 1, List.of(target), List.of());

        assertEquals(2, circuit.getLayers().size());
        assertTrue(circuit.getLayers().get(1).getQuantumOperations().contains(op));
    }

    @Test
    void removeQuantumOperation_byId() {
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        ElementSelector target = new ElementSelector(registerId, 1);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.H,false, List.of(target), List.of(), 0d);

        circuit.addQuantumOperation(op, 0);
        circuit.removeQuantumOperation(op.getId());

        assertTrue(circuit.getLayers().getFirst().getQuantumOperations().isEmpty());
    }

    @Test
    void invalidQubitIndexThrowsException() {
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();
        assertThrows(IllegalArgumentException.class, () -> circuit.removeQubit(registerId, INIT_QUBITS + 1));
    }
}