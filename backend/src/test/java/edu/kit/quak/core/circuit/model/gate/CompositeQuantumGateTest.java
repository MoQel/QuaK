package edu.kit.quak.core.circuit.model.gate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import org.junit.jupiter.api.Test;

/** Covers calling a gate: what it is made of, which wires it really touches, and nesting. */
@UnitTest
class CompositeQuantumGateTest {

    private static final String REGISTER_ID = "reg-q";

    private static ElementSelector qubit(int index) {
        return new ElementSelector(REGISTER_ID, index);
    }

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

    private static List<QuantumOperationLibrary> kinds(List<QuantumOperation> operations) {
        return operations.stream().map(QuantumOperation::getOperationDefinition).toList();
    }

    @Test
    void callCarriesNameAndPortLabels() {
        CompositeQuantumGate call = new CompositeQuantumGate(bell(), false, List.of(qubit(0), qubit(1)));

        assertEquals("bell", call.getGateName());
        assertEquals(QuantumOperationLibrary.COMPOSITE, call.getOperationDefinition());
        assertEquals("a", call.getPortLabel(0));
        assertEquals("b", call.getPortLabel(1));
    }

    @Test
    void expandShowsWhatTheGateIsMadeOf() {
        CompositeQuantumGate call = new CompositeQuantumGate(bell(), false, List.of(qubit(2), qubit(3)));

        List<QuantumOperation> parts = call.expand();

        assertEquals(List.of(QuantumOperationLibrary.H, QuantumOperationLibrary.CX), kinds(parts));
        assertEquals(List.of(qubit(2)), parts.get(0).getTargetQubits());
        assertEquals(List.of(qubit(3)), parts.get(1).getTargetQubits());
        assertEquals(List.of(qubit(2)), parts.get(1).getControlQubits());
    }

    @Test
    void callRejectsWrongArity() {
        InvalidOperationConfigurationException ex = assertThrows(InvalidOperationConfigurationException.class, () ->
            new CompositeQuantumGate(bell(), false, List.of(qubit(0)))
        );

        assertTrue(ex.getMessage().contains("expects 2 qubit(s) but got 1"), ex.getMessage());
    }

    @Test
    void callRejectsRepeatedQubit() {
        assertThrows(InvalidOperationConfigurationException.class, () ->
            new CompositeQuantumGate(bell(), false, List.of(qubit(0), qubit(0)))
        );
    }

    // --- which qubits are actually used ---

    /** `gate foo a, b, c { h a; cx a, c; }` never touches b, so that wire only passes through. */
    @Test
    void unusedParameterIsReportedAsUnused() {
        GateDefinition foo = new GateDefinition("foo", List.of("a", "b", "c"));
        foo.addOperation(new ElementaryQuantumGate(QuantumOperationLibrary.H, false, List.of(foo.selectorFor("a")), List.of(), 0.0));
        foo.addOperation(
            new ElementaryQuantumGate(QuantumOperationLibrary.CX, false, List.of(foo.selectorFor("c")), List.of(foo.selectorFor("a")), 0.0)
        );

        assertEquals(List.of(0, 2), foo.getUsedParameterIndices());
        assertEquals(List.of("a", "c"), foo.getUsedParameterNames());

        CompositeQuantumGate call = new CompositeQuantumGate(foo, false, List.of(qubit(5), qubit(6), qubit(7)));
        assertEquals(List.of(qubit(5), qubit(7)), call.getUsedQubits());
        // The box still spans all three wires it was called on.
        assertEquals(List.of(qubit(5), qubit(6), qubit(7)), call.getTargetQubits());
    }

    @Test
    void everyParameterIsUsedWhenTheBodyTouchesThemAll() {
        CompositeQuantumGate call = new CompositeQuantumGate(bell(), false, List.of(qubit(0), qubit(1)));

        assertEquals(List.of(qubit(0), qubit(1)), call.getUsedQubits());
    }

    @Test
    void emptyBodyUsesNoQubits() {
        GateDefinition empty = new GateDefinition("nop", List.of("a"));

        assertEquals(List.of(), empty.getUsedParameterIndices());
        assertEquals(List.of(), new CompositeQuantumGate(empty, false, List.of(qubit(0))).getUsedQubits());
    }

    // --- nesting ---

    /** A gate built from another gate must stay visibly built from it, not be flattened. */
    @Test
    void nestedCallKeepsItsNesting() {
        GateDefinition bell = bell();
        GateDefinition bell3 = new GateDefinition("bell3", List.of("x", "y", "z"));
        bell3.addOperation(new CompositeQuantumGate(bell, false, List.of(bell3.selectorFor("x"), bell3.selectorFor("y"))));
        bell3.addOperation(
            new ElementaryQuantumGate(
                QuantumOperationLibrary.CX,
                false,
                List.of(bell3.selectorFor("z")),
                List.of(bell3.selectorFor("y")),
                0.0
            )
        );

        CompositeQuantumGate call = new CompositeQuantumGate(bell3, false, List.of(qubit(0), qubit(1), qubit(2)));
        List<QuantumOperation> oneLevel = call.expand();

        assertEquals(List.of(QuantumOperationLibrary.COMPOSITE, QuantumOperationLibrary.CX), kinds(oneLevel));
        CompositeQuantumGate nested = (CompositeQuantumGate) oneLevel.getFirst();
        assertEquals("bell", nested.getGateName());
        assertEquals(List.of(qubit(0), qubit(1)), nested.getTargetQubits());
    }

    @Test
    void expandToElementaryFlattensAllLevels() {
        GateDefinition bell = bell();
        GateDefinition bell3 = new GateDefinition("bell3", List.of("x", "y", "z"));
        bell3.addOperation(new CompositeQuantumGate(bell, false, List.of(bell3.selectorFor("x"), bell3.selectorFor("y"))));
        bell3.addOperation(
            new ElementaryQuantumGate(
                QuantumOperationLibrary.CX,
                false,
                List.of(bell3.selectorFor("z")),
                List.of(bell3.selectorFor("y")),
                0.0
            )
        );

        List<QuantumOperation> flat = new CompositeQuantumGate(bell3, false, List.of(qubit(0), qubit(1), qubit(2))).expandToElementary();

        assertEquals(List.of(QuantumOperationLibrary.H, QuantumOperationLibrary.CX, QuantumOperationLibrary.CX), kinds(flat));
        assertEquals(List.of(qubit(0)), flat.get(0).getTargetQubits());
        assertEquals(List.of(qubit(1)), flat.get(1).getTargetQubits());
        assertEquals(List.of(qubit(2)), flat.get(2).getTargetQubits());
    }

    /** A nested call is bound through its parent, so port order survives two levels. */
    @Test
    void nestingRespectsParameterOrderAcrossLevels() {
        GateDefinition bell = bell();
        GateDefinition flipped = new GateDefinition("flipped", List.of("x", "y"));
        // Deliberately swapped: bell's `a` is bound to flipped's `y`.
        flipped.addOperation(new CompositeQuantumGate(bell, false, List.of(flipped.selectorFor("y"), flipped.selectorFor("x"))));

        List<QuantumOperation> flat = new CompositeQuantumGate(flipped, false, List.of(qubit(0), qubit(1))).expandToElementary();

        // h lands on the wire bound to `y`, i.e. qubit 1.
        assertEquals(List.of(qubit(1)), flat.get(0).getTargetQubits());
        assertEquals(List.of(qubit(0)), flat.get(1).getTargetQubits());
    }

    // --- recursion guard ---

    @Test
    void directRecursionIsRejected() {
        GateDefinition loop = new GateDefinition("loop", List.of("a", "b"));

        InvalidOperationConfigurationException ex = assertThrows(InvalidOperationConfigurationException.class, () ->
            loop.addOperation(new CompositeQuantumGate(loop, false, List.of(loop.selectorFor("a"), loop.selectorFor("b"))))
        );

        assertTrue(ex.getMessage().contains("recursive"), ex.getMessage());
    }

    @Test
    void indirectRecursionIsRejected() {
        GateDefinition inner = new GateDefinition("inner", List.of("a", "b"));
        GateDefinition outer = new GateDefinition("outer", List.of("a", "b"));
        outer.addOperation(new CompositeQuantumGate(inner, false, List.of(outer.selectorFor("a"), outer.selectorFor("b"))));

        // inner using outer would close the cycle outer -> inner -> outer.
        assertTrue(outer.dependsOn(inner));
        assertFalse(inner.dependsOn(outer));
        assertThrows(InvalidOperationConfigurationException.class, () ->
            inner.addOperation(new CompositeQuantumGate(outer, false, List.of(inner.selectorFor("a"), inner.selectorFor("b"))))
        );
    }

    /** Using the same gate twice is not recursion and must stay allowed. */
    @Test
    void repeatedUseOfTheSameGateIsAllowed() {
        GateDefinition bell = bell();
        GateDefinition twice = new GateDefinition("twice", List.of("a", "b"));

        twice.addOperation(new CompositeQuantumGate(bell, false, List.of(twice.selectorFor("a"), twice.selectorFor("b"))));
        twice.addOperation(new CompositeQuantumGate(bell, false, List.of(twice.selectorFor("b"), twice.selectorFor("a"))));

        assertEquals(4, new CompositeQuantumGate(twice, false, List.of(qubit(0), qubit(1))).expandToElementary().size());
    }

    /** A body may only address its own parameters — a nested call is no exception. */
    @Test
    void nestedCallOnForeignRegisterIsRejected() {
        GateDefinition bell = bell();
        GateDefinition outer = new GateDefinition("outer", List.of("a", "b"));

        assertThrows(InvalidOperationConfigurationException.class, () ->
            outer.addOperation(new CompositeQuantumGate(bell, false, List.of(qubit(0), qubit(1))))
        );
    }
}
