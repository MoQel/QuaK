package edu.kit.quak.core.circuit.model;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import java.util.List;
import org.junit.jupiter.api.Test;

class QuantumCircuitTest {

    public static final int INIT_QUBITS = 4;

    @Test
    void constructor_initializesRegisterAndLayer() {
        // Act
        QuantumCircuit circuit = new QuantumCircuit();

        // Assert
        assertEquals(1, circuit.getRegisters().size(), "Circuit should initialize with one register.");
        assertTrue(circuit.getRegisters().getFirst().asQuantum().isPresent(), "The default register should be a QuantumRegister.");
        assertEquals(
            INIT_QUBITS,
            circuit.getRegisters().getFirst().asQuantum().get().getNumberOfQubits(),
            "The register should have the default number of qubits."
        );
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
        assertTrue(
            circuit.getLayers().getFirst().getQuantumOperations().contains(op),
            "The operation should be stored in the newly created layer."
        );
    }

    @Test
    void moveQuantumOperation_changesLayerAndSelectors() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        ElementSelector target1 = new ElementSelector(registerId, 0);
        QuantumOperation op1 = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target1), List.of(), 0d);
        circuit.addQuantumOperation(op1, 0);

        ElementSelector target2 = new ElementSelector(registerId, 0);
        QuantumOperation op2 = new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target2), List.of(), 0d);
        circuit.addQuantumOperation(op2, 1);

        ElementSelector target3 = new ElementSelector(registerId, 1);
        QuantumOperation op3 = new ElementaryQuantumGate(QuantumOperationLibrary.Y, false, List.of(target3), List.of(), 0d);
        circuit.addQuantumOperation(op3, 0);

        ElementSelector target4 = new ElementSelector(registerId, 1);
        QuantumOperation op4 = new ElementaryQuantumGate(QuantumOperationLibrary.Z, false, List.of(target4), List.of(), 0d);
        circuit.addQuantumOperation(op4, 1);

        // Act
        // Move op2 to position of op3 => op3 and op4 should be moved to next layer
        circuit.moveQuantumOperation(op2.getId(), 0, List.of(new ElementSelector(registerId, 1)), List.of());

        // Assert
        assertEquals(3, circuit.getLayers().size(), "Operation movement should create a third layer.");
        assertTrue(
            circuit.getLayers().getFirst().getQuantumOperations().contains(op2),
            "The operation 2 should exist in the target layer."
        );
        assertTrue(circuit.getLayers().get(1).getQuantumOperations().contains(op3), "The operation 3 should be moved to the next layer.");
        assertTrue(circuit.getLayers().get(2).getQuantumOperations().contains(op4), "The operation 4 should be moved to the next layer.");
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
        assertThrows(
            IllegalArgumentException.class,
            () -> circuit.removeQubit(registerId, INIT_QUBITS + 1),
            "Should throw an exception when trying to remove a qubit with an out-of-bounds index."
        );
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

        ElementSelector target1 = new ElementSelector(registerId, 0);
        QuantumOperation op1 = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target1), List.of(), 0d);
        circuit.addQuantumOperation(op1, 0);

        ElementSelector target2 = new ElementSelector(registerId, 0);
        QuantumOperation op2 = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target2), List.of(), 0d);
        circuit.addQuantumOperation(op2, 1);

        // Act
        circuit.moveQuantumOperation(op2.getId(), 0, List.of(new ElementSelector(registerId, 1)), List.of());

        // Assert
        assertEquals(1, circuit.getLayers().size(), "Second layer is now empty and should be flushed.");
    }
}
