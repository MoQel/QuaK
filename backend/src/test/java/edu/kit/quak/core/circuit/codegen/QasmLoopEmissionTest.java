package edu.kit.quak.core.circuit.codegen;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Writing repetition frames back out as {@code for} loops.
 *
 * <p>The strongest statement these tests can make is the round trip: parse, generate, parse again
 * and end up with the same frames over the same body. Anything the generator drops or repeats wrong
 * shows up there rather than in a string comparison.
 */
@UnitTest
class QasmLoopEmissionTest {

    private QuantumCircuit parse(String code) {
        return new QasmService().parse(code);
    }

    private String generate(String code) {
        return QasmCodeGenerator.toCode(parse(code));
    }

    private QuantumCircuit roundTrip(String code) {
        return parse(generate(code));
    }

    private List<String> identifiers(QuantumCircuit circuit) {
        List<String> identifiers = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (QuantumOperation operation : layer.getQuantumOperations()) {
                identifiers.add(
                    operation instanceof CompositeQuantumGate composite
                        ? composite.getGateName()
                        : operation.getOperationDefinition().name()
                );
            }
        }
        return identifiers;
    }

    private List<Integer> repeatCounts(QuantumCircuit circuit) {
        return circuit.getLoopBlocks().stream().map(LoopBlock::getRepeatCount).sorted().toList();
    }

    @Test
    void aFrameIsWrittenAsAForLoop() {
        String code = generate(
            """
            qubit[2] q;
            for uint i in [0:2] { h q[0]; cx q[0], q[1]; }
            """
        );

        assertTrue(code.contains("for uint i in [0:2] {"), "Missing loop in:\n" + code);
        // The body appears once, not three times.
        assertEquals(1, code.split("h q\\[0\\];", -1).length - 1, "Body written more than once:\n" + code);
    }

    @Test
    void aFrameSurvivesTheRoundTrip() {
        QuantumCircuit circuit = roundTrip(
            """
            qubit[2] q;
            for uint i in [0:2] { h q[0]; cx q[0], q[1]; }
            """
        );

        assertEquals(List.of("H", "CX"), identifiers(circuit));
        assertEquals(List.of(3), repeatCounts(circuit));
    }

    /** Operations outside the frame must stay outside it, in front and behind. */
    @Test
    void neighboursStayOutsideTheLoop() {
        String code = generate(
            """
            qubit[4] q;
            x q[0];
            for int i in [0:2] {
                cx q[2], q[1];
                cx q[2], q[0];
                ccx q[0], q[1], q[2];
            }
            h q[3];
            """
        );

        assertTrue(code.contains("x q[0];\n"), "Missing the leading X in:\n" + code);
        assertTrue(code.indexOf("x q[0];") < code.indexOf("for "), "The X must precede the loop:\n" + code);

        QuantumCircuit circuit = parse(code);
        assertEquals(List.of(3), repeatCounts(circuit));
        // Frame members plus the two neighbours, each exactly once.
        assertEquals(5, identifiers(circuit).size());
    }

    @Test
    void nestedFramesBecomeNestedLoops() {
        String code = generate(
            """
            qubit[3] q;
            for int i in [0:1] {
                h q[0];
                for int j in [0:2] { cx q[0], q[1]; }
            }
            """
        );

        assertTrue(code.contains("for uint i in [0:1] {"), "Missing outer loop in:\n" + code);
        assertTrue(code.contains("for uint j in [0:2] {"), "Missing inner loop in:\n" + code);

        QuantumCircuit circuit = parse(code);
        assertEquals(List.of(2, 3), repeatCounts(circuit));
    }

    /**
     * Two frames over exactly the same operations are one inside the other. Writing only one would
     * silently drop a factor from how often the body runs.
     */
    @Test
    void framesOverTheSameOperationsBecomeTwoLoops() {
        String code = generate(
            """
            qubit[1] q;
            for int i in [0:1] { for int j in [0:2] { h q[0]; } }
            """
        );

        assertEquals(2, code.split("for uint", -1).length - 1, "Expected two loops in:\n" + code);

        QuantumCircuit circuit = parse(code);
        assertEquals(List.of("H"), identifiers(circuit));
        assertEquals(List.of(2, 3), repeatCounts(circuit));
    }

    /** A user-defined gate inside a loop needs both features at once. */
    @Test
    void aCompositeInsideALoopRoundTrips() {
        QuantumCircuit circuit = roundTrip(
            """
            qubit[3] q;
            gate majority a, b, c { cx c, b; cx c, a; ccx a, b, c; }
            for int i in [0:3] { majority q[0], q[1], q[2]; }
            """
        );

        assertEquals(List.of("majority"), identifiers(circuit));
        assertEquals(List.of(4), repeatCounts(circuit));
    }

    /** A sweep was never a frame, so nothing about its emission may change. */
    @Test
    void anUnrolledSweepIsStillWrittenOutInFull() {
        String code = generate(
            """
            qubit[4] q;
            for uint i in [0:2] { cx q[i], q[i + 1]; }
            """
        );

        assertTrue(!code.contains("for "), "A sweep must not be written as a loop:\n" + code);
        assertEquals(3, identifiers(parse(code)).size());
    }

    @Test
    void aCircuitWithoutFramesKeepsItsLayerHeadings() {
        String code = generate(
            """
            qubit[2] q;
            h q[0];
            cx q[0], q[1];
            """
        );

        assertTrue(code.contains("// Layer 1"), "Missing layer heading in:\n" + code);
        assertTrue(code.contains("// Layer 2"), "Missing layer heading in:\n" + code);
    }
}
