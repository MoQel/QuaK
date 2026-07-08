package edu.kit.quak.core.circuit.model;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.exceptions.InvalidRegisterTypeException;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.common.exception.RequestedIndexOutOfBounds;
import java.util.List;
import org.junit.jupiter.api.Test;

class QuantumCircuitTest {

    private static final int TEST_QUBITS = 4;

    private static QuantumCircuit createCircuitWithQuantumRegister() {
        QuantumCircuit circuit = new QuantumCircuit("");
        circuit.addRegister(new QuantumRegister("q", TEST_QUBITS));
        return circuit;
    }

    @Test
    void constructor_startsWithNoRegistersAndNoLayers() {
        // Act
        QuantumCircuit circuit = new QuantumCircuit("");

        // Assert
        assertTrue(circuit.getRegisters().isEmpty(), "Circuit should start without implicit registers.");
        assertEquals(0, circuit.getLayers().size(), "Circuit should start with no layers.");
    }

    @Test
    void addAndRemoveQubit() {
        // Arrange
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        QuantumRegister qr = circuit.getRegisters().getFirst().asQuantum().orElseThrow();

        // Act
        circuit.addQubit(qr.getId());
        circuit.addQubit(qr.getId());
        int afterAdding = qr.getNumberOfQubits();

        circuit.removeQubit(qr.getId(), 0);
        int afterRemoving = qr.getNumberOfQubits();

        // Assert
        assertEquals(TEST_QUBITS + 2, afterAdding, "Qubit count should increase by two.");
        assertEquals(TEST_QUBITS + 1, afterRemoving, "Qubit count should decrease by one after removal.");
    }

    @Test
    void addQuantumOperation_createsNewLayerIfNecessary() {
        // Arrange
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
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
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
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
        circuit.moveQuantumOperation(op2.getId(), 0, List.of(new ElementSelector(registerId, 1)), List.of(), null);

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
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
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
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        // Act & Assert
        assertThrows(
            RequestedIndexOutOfBounds.class,
            () -> circuit.removeQubit(registerId, TEST_QUBITS + 1),
            "Should throw an exception when trying to remove a qubit with an out-of-bounds index."
        );
    }

    @Test
    void flushLayers_afterRemovingQubit_emptyLayersAreCleanedUp() {
        // Arrange
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
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
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
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
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().getId();

        ElementSelector target1 = new ElementSelector(registerId, 0);
        QuantumOperation op1 = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target1), List.of(), 0d);
        circuit.addQuantumOperation(op1, 0);

        ElementSelector target2 = new ElementSelector(registerId, 0);
        QuantumOperation op2 = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target2), List.of(), 0d);
        circuit.addQuantumOperation(op2, 1);

        // Act
        circuit.moveQuantumOperation(op2.getId(), 0, List.of(new ElementSelector(registerId, 1)), List.of(), null);

        // Assert
        assertEquals(1, circuit.getLayers().size(), "Second layer is now empty and should be flushed.");
    }

    @Test
    void measurement_cannotBeInverted() {
        // Arrange
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        ElementSelector classicBit = new ElementSelector("creg", 0);

        // Act & Assert
        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, true, List.of(target), List.of(), List.of(classicBit))
        );
    }

    @Test
    void measurement_cannotBeControlled() {
        // Arrange
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        ElementSelector control = new ElementSelector(registerId, 1);
        ElementSelector classicBit = new ElementSelector("creg", 0);

        // Act & Assert
        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target), List.of(control), List.of(classicBit))
        );
    }

    @Test
    void measurement_mustTargetExactlyOneQubit() {
        // Arrange
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target0 = new ElementSelector(registerId, 0);
        ElementSelector target1 = new ElementSelector(registerId, 1);
        ElementSelector classicBit = new ElementSelector("creg", 0);

        // Act & Assert
        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target0, target1), List.of(), List.of(classicBit))
        );
    }

    @Test
    void measurement_requiresClassicTargetBit() {
        // Arrange
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);

        // Act & Assert
        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target), List.of(), List.of())
        );
    }

    @Test
    void gate_cannotTargetClassicRegister() {
        // Arrange
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        ClassicRegister classicRegister = new ClassicRegister("c", 1);
        circuit.addRegister(classicRegister);
        ElementSelector target = new ElementSelector(classicRegister.getId(), 0);
        QuantumOperation gate = new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), List.of(), 0d);

        // Act & Assert
        assertThrows(InvalidRegisterTypeException.class, () -> circuit.addQuantumOperation(gate, 0));
    }

    @Test
    void measurement_classicBitsMustTargetClassicRegister() {
        // Arrange
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String quantumRegisterId = circuit.getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(quantumRegisterId, 0);
        ElementSelector classicBit = new ElementSelector(quantumRegisterId, 1);
        Measurement measurement = new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target), List.of(), List.of(classicBit));

        // Act & Assert
        assertThrows(InvalidRegisterTypeException.class, () -> circuit.addQuantumOperation(measurement, 0));
    }

    @Test
    void measurement_moveUpdatesClassicBits() {
        // Arrange
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        ClassicRegister firstClassicRegister = new ClassicRegister("c0", 1);
        ClassicRegister secondClassicRegister = new ClassicRegister("c1", 1);
        circuit.addRegister(firstClassicRegister);
        circuit.addRegister(secondClassicRegister);

        String quantumRegisterId = circuit.getRegisters().getFirst().getId();
        Measurement measurement = new Measurement(
            QuantumOperationLibrary.MEASURE,
            false,
            List.of(new ElementSelector(quantumRegisterId, 0)),
            List.of(),
            List.of(new ElementSelector(firstClassicRegister.getId(), 0))
        );
        circuit.addQuantumOperation(measurement, 0);

        // Act
        circuit.moveQuantumOperation(
            measurement.getId(),
            0,
            List.of(new ElementSelector(quantumRegisterId, 0)),
            List.of(),
            List.of(new ElementSelector(secondClassicRegister.getId(), 0))
        );

        // Assert
        Measurement movedMeasurement = (Measurement) circuit.getLayers().getFirst().getQuantumOperations().getFirst();
        assertEquals(secondClassicRegister.getId(), movedMeasurement.getClassicBits().getFirst().getRegisterId());
    }
}
