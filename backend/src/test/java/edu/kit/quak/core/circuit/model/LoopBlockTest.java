package edu.kit.quak.core.circuit.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import org.junit.jupiter.api.Test;

/** The repetition frame itself, and the circuit's bookkeeping when its members go away. */
@UnitTest
class LoopBlockTest {

    private QuantumCircuit circuitWithGates(int count) {
        QuantumCircuit circuit = new QuantumCircuit("", "f-1");
        QuantumRegister register = circuit.getRegisters().getFirst().asQuantum().orElseThrow();
        for (int i = 0; i < count; i++) {
            circuit.addQuantumOperation(gateOn(register, i), circuit.getLayers().size());
        }
        return circuit;
    }

    private ElementaryQuantumGate gateOn(QuantumRegister register, int qubitIdx) {
        return new ElementaryQuantumGate(
            QuantumOperationLibrary.H,
            false,
            List.of(new ElementSelector(register.getId(), qubitIdx)),
            List.of(),
            0
        );
    }

    private List<String> operationIds(QuantumCircuit circuit) {
        return circuit
            .getLayers()
            .stream()
            .flatMap(layer -> layer.getQuantumOperations().stream())
            .map(QuantumOperation::getId)
            .toList();
    }

    @Test
    void aFrameNeedsAtLeastTwoPassesAndOneMember() {
        assertThrows(InvalidOperationConfigurationException.class, () -> new LoopBlock(1, List.of("op")));
        assertThrows(InvalidOperationConfigurationException.class, () -> new LoopBlock(3, List.of()));
        assertThrows(InvalidOperationConfigurationException.class, () -> new LoopBlock(3, List.of("op", "op")));
    }

    /**
     * A frame naming an operation the circuit does not have would draw around nothing — and worse,
     * make code generation repeat a body that is not there.
     */
    @Test
    void circuitRejectsAFrameOverForeignOperations() {
        QuantumCircuit circuit = circuitWithGates(2);
        List<String> ids = operationIds(circuit);

        assertThrows(InvalidOperationConfigurationException.class, () ->
            circuit.addLoopBlock(new LoopBlock(2, List.of(ids.getFirst(), "ghost")))
        );
    }

    @Test
    void removingAMemberShrinksTheFrame() {
        QuantumCircuit circuit = circuitWithGates(2);
        List<String> ids = operationIds(circuit);
        circuit.addLoopBlock(new LoopBlock(2, ids));

        circuit.removeQuantumOperation(ids.getFirst());

        assertEquals(1, circuit.getLoopBlocks().size());
        assertEquals(List.of(ids.get(1)), circuit.getLoopBlocks().getFirst().getOperationIds());
    }

    @Test
    void aFrameThatLosesAllMembersIsDropped() {
        QuantumCircuit circuit = circuitWithGates(2);
        List<String> ids = operationIds(circuit);
        circuit.addLoopBlock(new LoopBlock(2, ids));

        circuit.removeQuantumOperations(ids);

        assertTrue(circuit.getLoopBlocks().isEmpty());
    }

    /** Deleting a qubit deletes the gates on it, so the frames must let go of them too. */
    @Test
    void deletingAQubitDetachesItsGatesFromFrames() {
        QuantumCircuit circuit = circuitWithGates(2);
        QuantumRegister register = circuit.getRegisters().getFirst().asQuantum().orElseThrow();
        List<String> ids = operationIds(circuit);
        circuit.addLoopBlock(new LoopBlock(2, ids));

        circuit.removeQubit(register.getId(), 0);

        assertEquals(1, circuit.getLoopBlocks().size());
        assertEquals(1, circuit.getLoopBlocks().getFirst().getOperationIds().size());
    }
}
