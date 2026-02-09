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
        // Act
        QuantumCircuit circuit = new QuantumCircuit();

        // Assert
        assertEquals(1, circuit.getRegisters().size(), "Circuit should initialize with one register.");
        assertTrue(circuit.getRegisters().getFirst().asQuantum().isPresent(), "The default register should be a QuantumRegister.");
        assertEquals(INIT_QUBITS, circuit.getRegisters().getFirst().asQuantum().get().getNumberOfQubits(), "The register should have the default number of qubits.");
        assertEquals(0, circuit.getLayers().size(), "Circuit should start with no layers.");
    }

    @Test
    void addAndRemoveQubit() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        QuantumRegister qr = circuit.getRegisters().getFirst().asQuantum().orElseThrow();

        // Act
        circuit.addQubit(qr.getId());
        circuit.addQubit(qr.getId());
        int afterAdding = qr.getNumberOfQubits();

        circuit.removeQubit(qr.getId(), 0);
        int afterRemoving = qr.getNumberOfQubits();

        // Assert
        assertEquals(INIT_QUBITS + 2, afterAdding, "Qubit count should increase by two.");
        assertEquals(INIT_QUBITS + 1, afterRemoving, "Qubit count should decrease by one after removal.");
    }

    @Test
    void addQuantumOperation_createsNewLayerIfNecessary() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();
        ElementSelector target = new ElementSelector(registerId, 1);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.T, false, List.of(target), List.of(), 0d);

        // Act
        circuit.addQuantumOperation(op, 0);

        // Assert
        assertEquals(1, circuit.getLayers().size(), "A new layer should be created when adding the first operation.");
        assertTrue(circuit.getLayers().getFirst().getQuantumOperations().contains(op), "The operation should be stored in the newly created layer.");
    }

    @Test
    void moveQuantumOperation_changesLayerAndSelectors() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        ElementSelector target = new ElementSelector(registerId, 0);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        // Act
        circuit.moveQuantumOperation(op.getId(), 1, List.of(target), List.of());

        // Assert
        assertEquals(1, circuit.getLayers().size(), "Source layer should be flushed, leaving only the target layer.");
        assertTrue(circuit.getLayers().getFirst().getQuantumOperations().contains(op), "The operation should exist in the target layer.");
    }

    @Test
    void removeQuantumOperation_byId() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        ElementSelector target = new ElementSelector(registerId, 1);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        // Act
        circuit.removeQuantumOperation(op.getId());

        // Assert
        assertTrue(circuit.getLayers().isEmpty(), "The layer list should be empty after removing the only operation.");
    }

    @Test
    void invalidQubitIndexThrowsException() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> circuit.removeQubit(registerId, INIT_QUBITS + 1),
                "Should throw an exception when trying to remove a qubit with an out-of-bounds index.");
    }

    @Test
    void flushLayers_afterRemovingQubit_emptyLayersAreCleanedUp() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.Z, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        // Act
        circuit.removeQubit(registerId, 0);

        // Assert
        assertTrue(circuit.getLayers().isEmpty(), "Layers remaining empty after qubit removal must be flushed.");
    }

    @Test
    void flushLayers_afterRemovingLastOperation_layerIsRemoved() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        // Act
        circuit.removeQuantumOperation(op.getId());

        // Assert
        assertTrue(circuit.getLayers().isEmpty(), "Empty layers should be automatically removed (flushed).");
    }

    @Test
    void flushLayers_afterMovingLastOperation_sourceLayerIsRemoved() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        // Act
        circuit.moveQuantumOperation(op.getId(), 1, List.of(target), List.of());

        // Assert
        assertEquals(1, circuit.getLayers().size(), "Only the target layer should remain; the empty source layer should be flushed.");
    }
}