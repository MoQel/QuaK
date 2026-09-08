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

    private static final int INIT_QUBITS = 4;

    private static QuantumCircuit createCircuitWithQuantumRegister() {
        return new QuantumCircuit("", "f-1");
    }

    @Test
    void constructor_initializesRegisterAndLayer() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();

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
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        QuantumRegister qr = circuit.getRegisters().getFirst().asQuantum().orElseThrow();

        circuit.addQubit(qr.getId());
        circuit.addQubit(qr.getId());
        int afterAdding = qr.getNumberOfQubits();

        circuit.removeQubit(qr.getId(), 0);
        int afterRemoving = qr.getNumberOfQubits();

        assertEquals(INIT_QUBITS + 2, afterAdding, "Qubit count should increase by two.");
        assertEquals(INIT_QUBITS + 1, afterRemoving, "Qubit count should decrease by one after removal.");
    }

    @Test
    void addQuantumOperation_createsNewLayerIfNecessary() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();
        ElementSelector target = new ElementSelector(registerId, 1);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.T, false, List.of(target), List.of(), 0d);

        circuit.addQuantumOperation(op, 0);

        assertEquals(1, circuit.getLayers().size(), "A new layer should be created when adding the first operation.");
        assertTrue(
            circuit.getLayers().getFirst().getQuantumOperations().contains(op),
            "The operation should be stored in the newly created layer."
        );
    }

    @Test
    void moveQuantumOperation_changesLayerAndSelectors() {
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

        circuit.moveQuantumOperation(op2.getId(), 0, List.of(new ElementSelector(registerId, 1)), List.of(), null);

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
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        ElementSelector target = new ElementSelector(registerId, 1);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        circuit.removeQuantumOperation(op.getId());

        assertTrue(circuit.getLayers().isEmpty(), "The layer list should be empty after removing the only operation.");
    }

    @Test
    void invalidQubitIndexThrowsException() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        assertThrows(
            RequestedIndexOutOfBounds.class,
            () -> circuit.removeQubit(registerId, INIT_QUBITS + 1),
            "Should throw an exception when trying to remove a qubit with an out-of-bounds index."
        );
    }

    @Test
    void flushLayers_afterRemovingQubit_emptyLayersAreCleanedUp() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.Z, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        circuit.removeQubit(registerId, 0);

        assertTrue(circuit.getLayers().isEmpty(), "Layers remaining empty after qubit removal must be flushed.");
    }

    @Test
    void flushLayers_afterRemovingLastOperation_layerIsRemoved() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        QuantumOperation op = new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), List.of(), 0d);
        circuit.addQuantumOperation(op, 0);

        circuit.removeQuantumOperation(op.getId());

        assertTrue(circuit.getLayers().isEmpty(), "Empty layers should be automatically removed (flushed).");
    }

    @Test
    void removeMeasurementOperation_byId() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String quantumRegisterId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();
        ClassicRegister classicRegister = new ClassicRegister("c", 1);
        circuit.addRegister(classicRegister);

        ElementSelector target = new ElementSelector(quantumRegisterId, 0);
        ElementSelector classicBit = new ElementSelector(classicRegister.getId(), 0);
        QuantumOperation measurement = new Measurement(
            QuantumOperationLibrary.MEASURE,
            false,
            List.of(target),
            List.of(),
            List.of(classicBit)
        );
        circuit.addQuantumOperation(measurement, 0);

        circuit.removeQuantumOperation(measurement.getId());

        assertTrue(circuit.getLayers().isEmpty(), "Removing a measurement should also flush the empty layer.");
    }

    @Test
    void flushLayers_afterMovingLastOperation_sourceLayerIsRemoved() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().getId();

        ElementSelector target1 = new ElementSelector(registerId, 0);
        QuantumOperation op1 = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target1), List.of(), 0d);
        circuit.addQuantumOperation(op1, 0);

        ElementSelector target2 = new ElementSelector(registerId, 0);
        QuantumOperation op2 = new ElementaryQuantumGate(QuantumOperationLibrary.S, false, List.of(target2), List.of(), 0d);
        circuit.addQuantumOperation(op2, 1);

        circuit.moveQuantumOperation(op2.getId(), 0, List.of(new ElementSelector(registerId, 1)), List.of(), null);

        assertEquals(1, circuit.getLayers().size(), "Second layer is now empty and should be flushed.");
    }

    @Test
    void overlappingSpanGatesAreSeparatedIntoDifferentLayers() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        QuantumOperation cx02 = new ElementaryQuantumGate(
            QuantumOperationLibrary.CX,
            false,
            List.of(new ElementSelector(registerId, 2)),
            List.of(new ElementSelector(registerId, 0)),
            0d
        );
        circuit.addQuantumOperation(cx02, 0);

        QuantumOperation cx13 = new ElementaryQuantumGate(
            QuantumOperationLibrary.CX,
            false,
            List.of(new ElementSelector(registerId, 3)),
            List.of(new ElementSelector(registerId, 1)),
            0d
        );
        circuit.addQuantumOperation(cx13, 0);

        assertEquals(2, circuit.getLayers().size(), "Gates with overlapping spans must occupy separate layers.");
    }

    @Test
    void nonOverlappingGatesShareALayer() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String registerId = circuit.getRegisters().getFirst().asQuantum().orElseThrow().getId();

        QuantumOperation h0 = new ElementaryQuantumGate(
            QuantumOperationLibrary.H,
            false,
            List.of(new ElementSelector(registerId, 0)),
            List.of(),
            0d
        );
        circuit.addQuantumOperation(h0, 0);

        QuantumOperation x2 = new ElementaryQuantumGate(
            QuantumOperationLibrary.X,
            false,
            List.of(new ElementSelector(registerId, 2)),
            List.of(),
            0d
        );
        circuit.addQuantumOperation(x2, 0);

        assertEquals(1, circuit.getLayers().size(), "Non-overlapping operations may share a layer.");
    }

    @Test
    void measurement_cannotBeInverted() {
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        ElementSelector classicBit = new ElementSelector("creg", 0);

        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, true, List.of(target), List.of(), List.of(classicBit))
        );
    }

    @Test
    void measurement_cannotBeControlled() {
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);
        ElementSelector control = new ElementSelector(registerId, 1);
        ElementSelector classicBit = new ElementSelector("creg", 0);

        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target), List.of(control), List.of(classicBit))
        );
    }

    @Test
    void measurement_mustTargetExactlyOneQubit() {
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target0 = new ElementSelector(registerId, 0);
        ElementSelector target1 = new ElementSelector(registerId, 1);
        ElementSelector classicBit = new ElementSelector("creg", 0);

        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target0, target1), List.of(), List.of(classicBit))
        );
    }

    @Test
    void measurement_requiresClassicTargetBit() {
        String registerId = createCircuitWithQuantumRegister().getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(registerId, 0);

        assertThrows(InvalidOperationConfigurationException.class, () ->
            new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target), List.of(), List.of())
        );
    }

    @Test
    void gate_cannotTargetClassicRegister() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        ClassicRegister classicRegister = new ClassicRegister("c", 1);
        circuit.addRegister(classicRegister);
        ElementSelector target = new ElementSelector(classicRegister.getId(), 0);
        QuantumOperation gate = new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(target), List.of(), 0d);

        assertThrows(InvalidRegisterTypeException.class, () -> circuit.addQuantumOperation(gate, 0));
    }

    @Test
    void measurement_classicBitsMustTargetClassicRegister() {
        QuantumCircuit circuit = createCircuitWithQuantumRegister();
        String quantumRegisterId = circuit.getRegisters().getFirst().getId();
        ElementSelector target = new ElementSelector(quantumRegisterId, 0);
        ElementSelector classicBit = new ElementSelector(quantumRegisterId, 1);
        Measurement measurement = new Measurement(QuantumOperationLibrary.MEASURE, false, List.of(target), List.of(), List.of(classicBit));

        assertThrows(InvalidRegisterTypeException.class, () -> circuit.addQuantumOperation(measurement, 0));
    }

    @Test
    void measurement_moveUpdatesClassicBits() {
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

        circuit.moveQuantumOperation(
            measurement.getId(),
            0,
            List.of(new ElementSelector(quantumRegisterId, 0)),
            List.of(),
            List.of(new ElementSelector(secondClassicRegister.getId(), 0))
        );

        Measurement movedMeasurement = (Measurement) circuit.getLayers().getFirst().getQuantumOperations().getFirst();
        assertEquals(secondClassicRegister.getId(), movedMeasurement.getClassicBits().getFirst().getRegisterId());
    }
}
