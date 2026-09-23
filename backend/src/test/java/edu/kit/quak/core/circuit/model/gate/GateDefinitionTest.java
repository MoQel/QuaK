package edu.kit.quak.core.circuit.model.gate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Covers the gate container: building a body over formal qubits and expanding it at a call site. */
@UnitTest
class GateDefinitionTest {

    private static final String REGISTER_ID = "reg-q";

    /** `gate bell a, b { h a; cx a, b; }` */
    private static GateDefinition bell() {
        GateDefinition bell = new GateDefinition("bell", List.of("a", "b"));
        bell.addOperation(new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(bell.selectorFor("a")), List.of(), 0.0));
        bell.addOperation(
            new ElementaryQuantumGate(
                QuantumOperationLibrary.CX,
                false,
                List.of(bell.selectorFor("b")),
                List.of(bell.selectorFor("a")),
                0.0
            )
        );
        return bell;
    }

    private static ElementSelector qubit(int index) {
        return new ElementSelector(REGISTER_ID, index);
    }

    @Test
    void exposesArityAndPortLabels() {
        GateDefinition bell = bell();

        assertEquals(2, bell.getArity());
        assertEquals(List.of("a", "b"), bell.getParameterNames());
        assertEquals("a", bell.getParameterName(0));
        assertEquals("b", bell.getParameterName(1));
    }

    @Test
    void instantiateBindsBodyToActualQubits() {
        List<QuantumOperation> expanded = bell().instantiate(List.of(qubit(0), qubit(1)));

        assertEquals(2, expanded.size());

        QuantumOperation h = expanded.get(0);
        assertEquals(QuantumOperationLibrary.H, ((ElementaryQuantumGate) h).getOperationDefinition());
        assertEquals(List.of(qubit(0)), h.getTargetQubits());
        assertTrue(h.getControlQubits().isEmpty());

        QuantumOperation cx = expanded.get(1);
        assertEquals(QuantumOperationLibrary.CX, ((ElementaryQuantumGate) cx).getOperationDefinition());
        assertEquals(List.of(qubit(1)), cx.getTargetQubits());
        assertEquals(List.of(qubit(0)), cx.getControlQubits());
    }

    /** Parameter order is what maps ports to wires, so calling with swapped qubits must swap the body. */
    @Test
    void instantiateRespectsParameterOrder() {
        List<QuantumOperation> expanded = bell().instantiate(List.of(qubit(3), qubit(2)));

        assertEquals(List.of(qubit(3)), expanded.get(0).getTargetQubits());
        assertEquals(List.of(qubit(2)), expanded.get(1).getTargetQubits());
        assertEquals(List.of(qubit(3)), expanded.get(1).getControlQubits());
    }

    @Test
    void instantiateKeepsRotationAngle() {
        GateDefinition spin = new GateDefinition("spin", List.of("a"));
        spin.addOperation(
            new ElementaryQuantumGate(QuantumOperationLibrary.RX, false, List.of(spin.selectorFor("a")), List.of(), Math.PI / 2)
        );

        QuantumOperation expanded = spin.instantiate(List.of(qubit(0))).getFirst();

        assertEquals(Math.PI / 2, ((ElementaryQuantumGate) expanded).getRotationAngle());
    }

    /**
     * Selectors are mutable, so an expansion that aliased the body would let a later qubit removal
     * corrupt the definition itself.
     */
    @Test
    void instantiateSharesNoStateWithTheDefinition() {
        GateDefinition bell = bell();
        ElementSelector formalA = bell.getBody().getFirst().getTargetQubits().getFirst();

        List<QuantumOperation> first = bell.instantiate(List.of(qubit(0), qubit(1)));
        List<QuantumOperation> second = bell.instantiate(List.of(qubit(0), qubit(1)));

        assertNotSame(first.getFirst(), second.getFirst());
        assertNotSame(first.getFirst().getTargetQubits().getFirst(), second.getFirst().getTargetQubits().getFirst());

        // Mutating an expansion must not reach back into the body.
        first.getFirst().getTargetQubits().getFirst().decreaseIndex();
        assertEquals(0, formalA.getIndex());
        assertEquals(REGISTER_ID, bell.instantiate(List.of(qubit(0), qubit(1))).getFirst().getTargetQubits().getFirst().getRegisterId());
    }

    @Test
    void instantiateRejectsWrongArity() {
        InvalidOperationConfigurationException ex = assertThrows(InvalidOperationConfigurationException.class, () ->
            bell().instantiate(List.of(qubit(0)))
        );

        assertTrue(ex.getMessage().contains("expects 2 qubit(s) but got 1"), ex.getMessage());
    }

    /** `bell q[0], q[0]` would turn `cx a, b` into a self-controlled gate. */
    @Test
    void instantiateRejectsRepeatedQubit() {
        assertThrows(InvalidOperationConfigurationException.class, () -> bell().instantiate(List.of(qubit(0), qubit(0))));
    }

    /** A body reaching into a real register would make the gate depend on where it was defined. */
    @Test
    void bodyRejectsOperationOnForeignRegister() {
        GateDefinition bell = new GateDefinition("bell", List.of("a", "b"));

        InvalidOperationConfigurationException ex = assertThrows(InvalidOperationConfigurationException.class, () ->
            bell.addOperation(new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(qubit(0)), List.of(), 0.0))
        );

        assertTrue(ex.getMessage().contains("may only use its own qubit parameters"), ex.getMessage());
    }

    @Test
    void selectorForUnknownParameterIsRejected() {
        GateDefinition bell = bell();

        InvalidOperationConfigurationException ex = assertThrows(InvalidOperationConfigurationException.class, () -> bell.selectorFor("c"));

        assertTrue(ex.getMessage().contains("no qubit parameter 'c'"), ex.getMessage());
    }

    @Test
    void duplicateParameterNamesAreRejected() {
        assertThrows(InvalidOperationConfigurationException.class, () -> new GateDefinition("bad", List.of("a", "a")));
    }

    @Test
    void emptyParameterListIsRejected() {
        assertThrows(InvalidOperationConfigurationException.class, () -> new GateDefinition("bad", List.of()));
    }

    @Test
    void blankNameIsRejected() {
        assertThrows(InvalidOperationConfigurationException.class, () -> new GateDefinition("  ", List.of("a")));
    }

    /** Nesting is the point of a container: a definition's body may itself be built from expansions. */
    @Test
    void definitionCanBeBuiltFromAnotherDefinitionsExpansion() {
        GateDefinition bell = bell();
        GateDefinition bell3 = new GateDefinition("bell3", List.of("x", "y", "z"));

        bell.instantiate(List.of(bell3.selectorFor("x"), bell3.selectorFor("y"))).forEach(bell3::addOperation);
        bell3.addOperation(
            new ElementaryQuantumGate(
                QuantumOperationLibrary.CX,
                false,
                List.of(bell3.selectorFor("z")),
                List.of(bell3.selectorFor("y")),
                0.0
            )
        );

        List<QuantumOperation> expanded = bell3.instantiate(List.of(qubit(0), qubit(1), qubit(2)));

        assertEquals(
            List.of(QuantumOperationLibrary.H, QuantumOperationLibrary.CX, QuantumOperationLibrary.CX),
            expanded
                .stream()
                .map(op -> ((ElementaryQuantumGate) op).getOperationDefinition())
                .toList()
        );
        assertEquals(List.of(qubit(2)), expanded.get(2).getTargetQubits());
        assertEquals(List.of(qubit(1)), expanded.get(2).getControlQubits());
    }
}
