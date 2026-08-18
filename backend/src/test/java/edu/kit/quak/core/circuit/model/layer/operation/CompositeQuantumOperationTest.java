package edu.kit.quak.core.circuit.model.layer.operation;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import java.util.List;
import org.junit.jupiter.api.Test;

class CompositeQuantumOperationTest {

    @Test
    void constructor_initializesFieldsCorrectly() {
        // Arrange
        ElementSelector target0 = new ElementSelector("reg-1", 0);
        ElementSelector target1 = new ElementSelector("reg-1", 1);
        ElementSelector control0 = new ElementSelector("reg-1", 2);
        String definitionCircuitId = "subcircuit-42";

        // Act
        CompositeQuantumOperation op = new CompositeQuantumOperation(
            true,
            List.of(target0, target1),
            List.of(control0),
            definitionCircuitId
        );

        // Assert
        assertNotNull(op.getId());
        assertTrue(op.isInverseForm());
        assertEquals(2, op.getTargetQubits().size());
        assertEquals(1, op.getControlQubits().size());
        assertEquals(definitionCircuitId, op.getDefinitionCircuitId());
        assertTrue(op.toString().contains("definitionCircuitId=subcircuit-42"));
    }

    @Test
    void constructor_throwsWhenTargetQubitsEmpty() {
        assertThrows(InvalidOperationConfigurationException.class, () ->
            new CompositeQuantumOperation(false, List.of(), null, "subcircuit-42")
        );
    }

    @Test
    void constructor_throwsWhenDefinitionCircuitIdIsBlank() {
        ElementSelector target = new ElementSelector("reg-1", 0);
        assertThrows(InvalidOperationConfigurationException.class, () ->
            new CompositeQuantumOperation(false, List.of(target), null, "   ")
        );
    }

    @Test
    void integrationWithQuantumCircuit_asapSchedulingAndCollision() {
        // Arrange
        QuantumCircuit circuit = new QuantumCircuit("proj-1");
        QuantumRegister register = circuit.getRegisters().getFirst().asQuantum().orElseThrow();
        String regId = register.getId();

        // 4 qubits in circuit: q[0], q[1], q[2], q[3]
        ElementSelector q0 = new ElementSelector(regId, 0);
        ElementSelector q1 = new ElementSelector(regId, 1);
        ElementSelector q2 = new ElementSelector(regId, 2);
        ElementSelector q3 = new ElementSelector(regId, 3);

        // Subcircuit spans q[0] and q[1]
        CompositeQuantumOperation subCircuitOp1 = new CompositeQuantumOperation(false, List.of(q0, q1), null, "subcircuit-A");

        // Elementary gate on q[2]
        ElementaryQuantumGate hGate = new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(q2), null, 0.0);

        // Second subcircuit targeting q[0] and q[1] (collides with subCircuitOp1 on q[0], q[1])
        CompositeQuantumOperation subCircuitOp2 = new CompositeQuantumOperation(false, List.of(q0, q1), null, "subcircuit-B");

        // Act
        circuit.addQuantumOperation(subCircuitOp1, 0);
        circuit.addQuantumOperation(hGate, 0);
        circuit.addQuantumOperation(subCircuitOp2, 0);

        // Assert:
        // Layer 0 contains subCircuitOp1 (span 0-1) and hGate (span 2-2) without collision.
        // Layer 1 contains subCircuitOp2 (span 0-1) which was rescheduled due to collision with subCircuitOp1.
        assertEquals(2, circuit.getLayers().size(), "Circuit should have 2 layers after ASAP scheduling");
        assertEquals(2, circuit.getLayers().get(0).getQuantumOperations().size(), "Layer 0 should contain 2 non-overlapping operations");
        assertEquals(
            1,
            circuit.getLayers().get(1).getQuantumOperations().size(),
            "Layer 1 should contain the colliding subcircuit operation"
        );
    }
}
