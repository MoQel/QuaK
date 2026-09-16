package edu.kit.quak.core.circuit.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.ClassicRegister;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("unit")
class SubcircuitBindingTest {

    /** A two-qubit circuit `h q[0]; cx q[0], q[1];`, the shape a bell subcircuit has. */
    private QuantumCircuit bellDefinition() {
        // The builder rather than the two-argument constructor: that one seeds a default four-qubit
        // register, and the binding maps every quantum register the circuit has.
        QuantumRegister register = new QuantumRegister("q", 2);
        QuantumCircuit circuit = QuantumCircuit.builder()
            .projectId("proj-1")
            .fileId("file-1")
            .registers(new java.util.ArrayList<>(List.of(register)))
            .layers(new java.util.ArrayList<>())
            .build();
        circuit.addQuantumOperation(
            new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(new ElementSelector(register.getId(), 0)), List.of(), 0),
            0
        );
        circuit.addQuantumOperation(
            new ElementaryQuantumGate(
                QuantumOperationLibrary.CX,
                false,
                List.of(new ElementSelector(register.getId(), 1)),
                List.of(new ElementSelector(register.getId(), 0)),
                0
            ),
            1
        );
        return circuit;
    }

    @Test
    void bindsTheDefinitionOntoTheQubitsOfTheCall() {
        List<QuantumOperation> bound = SubcircuitBinding.bind(
            bellDefinition(),
            List.of(new ElementSelector("caller", 3), new ElementSelector("caller", 5))
        );

        assertEquals(2, bound.size());
        // Definition qubit 0 is the call's first, qubit 1 its second -- positional, in register order.
        assertEquals("caller", bound.getFirst().getTargetQubits().getFirst().getRegisterId());
        assertEquals(3, bound.getFirst().getTargetQubits().getFirst().getIndex());
        assertEquals(5, bound.get(1).getTargetQubits().getFirst().getIndex());
        assertEquals(3, bound.get(1).getControlQubits().getFirst().getIndex());
    }

    /** Selectors are mutable, so a bound body must never share them with the definition. */
    @Test
    void bindingCopiesSelectorsInsteadOfSharingThem() {
        QuantumCircuit definition = bellDefinition();
        List<QuantumOperation> bound = SubcircuitBinding.bind(
            definition,
            List.of(new ElementSelector("caller", 0), new ElementSelector("caller", 1))
        );

        bound.getFirst().getTargetQubits().getFirst().setIndex(9);

        ElementSelector original = definition.getLayers().getFirst().getQuantumOperations().getFirst().getTargetQubits().getFirst();
        assertEquals(0, original.getIndex());
    }

    /**
     * Half a body would run a circuit the referenced file does not describe, so a call that cannot
     * express the whole thing gets nothing at all.
     */
    @Test
    void aCallPassingTooFewQubitsBindsNothing() {
        List<QuantumOperation> bound = SubcircuitBinding.bind(bellDefinition(), List.of(new ElementSelector("caller", 0)));

        assertTrue(bound.isEmpty());
    }

    /**
     * A call may cover more wires than the definition uses -- the box was placed when the
     * referenced circuit was wider, or simply dropped over spare wires. The extra ones are left
     * alone rather than the whole call being refused.
     */
    @Test
    void aCallPassingMoreQubitsThanNeededBindsTheOnesItUses() {
        List<QuantumOperation> bound = SubcircuitBinding.bind(
            bellDefinition(),
            List.of(new ElementSelector("caller", 0), new ElementSelector("caller", 1), new ElementSelector("caller", 2))
        );

        assertEquals(2, bound.size());
        assertEquals(0, bound.getFirst().getTargetQubits().getFirst().getIndex());
        assertEquals(1, bound.get(1).getTargetQubits().getFirst().getIndex());
    }

    /** A measurement writes to a classical register of its own circuit; the caller has no bit for it. */
    @Test
    void aDefinitionThatMeasuresBindsNothing() {
        QuantumCircuit definition = bellDefinition();
        ClassicRegister bits = new ClassicRegister("c", 1);
        definition.addRegister(bits);
        QuantumRegister quantumRegister = (QuantumRegister) definition.getRegisterByName("q").orElseThrow();
        definition.addQuantumOperation(
            new Measurement(
                QuantumOperationLibrary.MEASURE,
                false,
                List.of(new ElementSelector(quantumRegister.getId(), 0)),
                List.of(),
                List.of(new ElementSelector(bits.getId(), 0))
            ),
            2
        );

        List<QuantumOperation> bound = SubcircuitBinding.bind(
            definition,
            List.of(new ElementSelector("caller", 0), new ElementSelector("caller", 1))
        );

        assertTrue(bound.isEmpty());
    }

    @Test
    void partialImportIndependentQubitSucceeds() {
        QuantumRegister register = new QuantumRegister("q", 2);
        QuantumCircuit circuit = QuantumCircuit.builder()
            .projectId("proj-1")
            .fileId("file-1")
            .registers(new java.util.ArrayList<>(List.of(register)))
            .layers(new java.util.ArrayList<>())
            .build();
        circuit.addQuantumOperation(
            new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(new ElementSelector(register.getId(), 0)), List.of(), 0),
            0
        );
        circuit.addQuantumOperation(
            new ElementaryQuantumGate(QuantumOperationLibrary.X, false, List.of(new ElementSelector(register.getId(), 1)), List.of(), 0),
            0
        );

        // Only import qubit 1 onto caller's qubit 3
        SubcircuitBinding.BindingResult result = SubcircuitBinding.bindWithResult(
            circuit,
            List.of(new ElementSelector("caller", 3)),
            List.of(1)
        );

        assertTrue(result.isSuccess());
        assertEquals(1, result.operations().size());
        assertEquals("caller", result.operations().getFirst().getTargetQubits().getFirst().getRegisterId());
        assertEquals(3, result.operations().getFirst().getTargetQubits().getFirst().getIndex());
    }

    @Test
    void partialImportEntangledQubitFailsWithDescriptiveError() {
        // bellDefinition has H on q0 and CX on q0, q1.
        // If we only import qubit 1, it is linked to missing qubit 0 via CX.
        SubcircuitBinding.BindingResult result = SubcircuitBinding.bindWithResult(
            bellDefinition(),
            List.of(new ElementSelector("caller", 0)),
            List.of(1)
        );

        org.junit.jupiter.api.Assertions.assertFalse(result.isSuccess());
        org.junit.jupiter.api.Assertions.assertNotNull(result.errorMessage());
        assertTrue(result.errorMessage().contains("linked to unmapped qubit q[0] via CX"), result.errorMessage());
    }
}
