package edu.kit.quak.application.parser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.core.circuit.model.LoopBlock;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.ArrayList;
import java.util.IntSummaryStatistics;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * How a {@code for} loop turns into a repetition frame.
 *
 * <p>A loop is collapsed to a framed body exactly when its passes came out alike; anything that
 * makes them differ — the counter in a qubit index, in an angle, in a gate parameter — leaves the
 * loop unrolled and unmarked, which is what the parser did for every loop before.
 */
@UnitTest
class QasmLoopBlockTest {

    private QuantumCircuit parse(String code) {
        return new QasmService().parse(code);
    }

    /** Every operation of the circuit, in layer order; composites stay whole. */
    private List<QuantumOperation> operations(QuantumCircuit circuit) {
        List<QuantumOperation> operations = new ArrayList<>();
        circuit.getLayers().forEach(layer -> operations.addAll(layer.getQuantumOperations()));
        return operations;
    }

    private List<String> identifiers(QuantumCircuit circuit) {
        return operations(circuit)
            .stream()
            .map(operation -> operation.getOperationDefinition().name())
            .toList();
    }

    private List<String> identifiersInColumn(QuantumCircuit circuit, int columnIdx) {
        return circuit
            .getLayers()
            .get(columnIdx)
            .getQuantumOperations()
            .stream()
            .map(operation -> operation.getOperationDefinition().name())
            .toList();
    }

    /** Global wire index of a selector, mirroring how the circuit orders its registers. */
    private int wireOf(QuantumCircuit circuit, ElementSelector selector) {
        int offset = 0;
        for (Register register : circuit.getRegisters()) {
            if (register.getId().equals(selector.getRegisterId())) {
                return offset + selector.getIndex();
            }
            offset += register.asQuantum().map(QuantumRegister::getNumberOfQubits).orElse(0);
        }
        return offset + selector.getIndex();
    }

    private int[] wireSpan(QuantumCircuit circuit, QuantumOperation operation) {
        IntSummaryStatistics stats = Stream.concat(operation.getTargetQubits().stream(), operation.getControlQubits().stream())
            .mapToInt(selector -> wireOf(circuit, selector))
            .summaryStatistics();
        return new int[] { stats.getMin(), stats.getMax() };
    }

    /**
     * The invariant the whole reservation exists for: nothing that is not a member may sit inside a
     * frame's rectangle. If it did, the editor would draw it as part of the loop while it runs once.
     */
    private void assertFramesContainOnlyTheirMembers(QuantumCircuit circuit) {
        for (LoopBlock block : circuit.getLoopBlocks()) {
            int firstColumn = Integer.MAX_VALUE;
            int lastColumn = Integer.MIN_VALUE;
            int spanMin = Integer.MAX_VALUE;
            int spanMax = Integer.MIN_VALUE;

            for (int columnIdx = 0; columnIdx < circuit.getLayers().size(); columnIdx++) {
                for (QuantumOperation operation : circuit.getLayers().get(columnIdx).getQuantumOperations()) {
                    if (block.covers(operation.getId())) {
                        firstColumn = Math.min(firstColumn, columnIdx);
                        lastColumn = Math.max(lastColumn, columnIdx);
                        int[] span = wireSpan(circuit, operation);
                        spanMin = Math.min(spanMin, span[0]);
                        spanMax = Math.max(spanMax, span[1]);
                    }
                }
            }

            for (int columnIdx = firstColumn; columnIdx <= lastColumn; columnIdx++) {
                for (QuantumOperation operation : circuit.getLayers().get(columnIdx).getQuantumOperations()) {
                    if (block.covers(operation.getId())) {
                        continue;
                    }
                    int[] span = wireSpan(circuit, operation);
                    boolean insideRectangle = span[0] <= spanMax && spanMin <= span[1];
                    assertFalse(
                        insideRectangle,
                        "%s sits in column %d, inside the frame's rectangle (wires %d..%d, columns %d..%d), but is not part of it".formatted(
                            operation,
                            columnIdx,
                            spanMin,
                            spanMax,
                            firstColumn,
                            lastColumn
                        )
                    );
                }
            }
        }
    }

    @Test
    void repeatedBodyIsKeptOnceAndFramed() {
        QuantumCircuit circuit = parse(
            """
            qubit[2] q;
            for uint i in [0:2] { h q[0]; cx q[0], q[1]; }
            """
        );

        // The body survives once, not three times.
        assertEquals(List.of("H", "CX"), identifiers(circuit));

        assertEquals(1, circuit.getLoopBlocks().size());
        LoopBlock block = circuit.getLoopBlocks().getFirst();
        assertEquals(3, block.getRepeatCount());
        assertEquals(operations(circuit).stream().map(QuantumOperation::getId).toList(), block.getOperationIds());
    }

    @Test
    void sweepingBodyStaysUnrolledAndUnmarked() {
        QuantumCircuit circuit = parse(
            """
            qubit[4] q;
            for uint i in [0:2] { cx q[i], q[i + 1]; }
            """
        );

        // Three different CX gates — nothing is repeated, so there is nothing to frame.
        assertEquals(List.of("CX", "CX", "CX"), identifiers(circuit));
        assertTrue(circuit.getLoopBlocks().isEmpty());
    }

    @Test
    void counterInAnAngleIsNotARepetition() {
        QuantumCircuit circuit = parse(
            """
            qubit[1] q;
            for uint i in [0:2] { rx(i * pi / 4) q[0]; }
            """
        );

        // Same gate, same qubit, but three different rotations.
        assertEquals(List.of("RX", "RX", "RX"), identifiers(circuit));
        assertTrue(circuit.getLoopBlocks().isEmpty());
    }

    @Test
    void singlePassGetsNoFrame() {
        QuantumCircuit circuit = parse(
            """
            qubit[1] q;
            for uint i in [0:0] { h q[0]; }
            """
        );

        assertEquals(List.of("H"), identifiers(circuit));
        assertTrue(circuit.getLoopBlocks().isEmpty(), "One pass is not a repetition.");
    }

    @Test
    void repeatedCallOfACustomGateIsFramed() {
        QuantumCircuit circuit = parse(
            """
            qubit[2] q;
            gate bell a, b { h a; cx a, b; }
            for uint i in [0:1] { bell q[0], q[1]; }
            """
        );

        List<QuantumOperation> operations = operations(circuit);
        assertEquals(1, operations.size());
        assertTrue(operations.getFirst() instanceof CompositeQuantumGate, "The gate stays one box.");
        assertEquals(2, circuit.getLoopBlocks().getFirst().getRepeatCount());
    }

    /**
     * A gate parametrized by the counter yields a different definition per pass — the definition
     * cache keys on the arguments — so the passes must not be mistaken for repetitions.
     */
    @Test
    void customGateParametrizedByTheCounterIsNotARepetition() {
        QuantumCircuit circuit = parse(
            """
            qubit[1] q;
            gate rot(theta) a { rz(theta) a; }
            for uint i in [0:1] { rot(i * pi / 4) q[0]; }
            """
        );

        assertEquals(2, operations(circuit).size());
        assertTrue(circuit.getLoopBlocks().isEmpty());
    }

    @Test
    void nestedRepetitionsProduceNestedFrames() {
        QuantumCircuit circuit = parse(
            """
            qubit[1] q;
            for uint i in [0:1] { for uint j in [0:2] { h q[0]; } }
            """
        );

        List<QuantumOperation> operations = operations(circuit);
        assertEquals(List.of("H"), identifiers(circuit));

        List<Integer> repeats = circuit.getLoopBlocks().stream().map(LoopBlock::getRepeatCount).sorted().toList();
        assertEquals(List.of(2, 3), repeats, "Inner loop x3 inside outer loop x2.");
        // Proper nesting: both frames sit on the one surviving gate.
        String survivor = operations.getFirst().getId();
        assertTrue(
            circuit
                .getLoopBlocks()
                .stream()
                .allMatch(block -> block.covers(survivor))
        );
    }

    /** The inner loop sweeps, so neither it nor the outer loop around it may collapse. */
    @Test
    void outerLoopDoesNotCollapseWhenTheInnerOneSweeps() {
        QuantumCircuit circuit = parse(
            """
            qubit[4] q;
            for uint i in [0:1] { for uint j in [0:1] { x q[2 * i + j]; } }
            """
        );

        assertEquals(4, operations(circuit).size());
        assertTrue(circuit.getLoopBlocks().isEmpty());
    }

    /**
     * Inside a gate body there is nothing to frame: the gate is already drawn as a single box and
     * its contents never reach the circuit's layers. The loop is simply unrolled, as before.
     */
    @Test
    void loopInsideAGateBodyIsUnrolledWithoutAFrame() {
        QuantumCircuit circuit = parse(
            """
            qubit[1] q;
            gate triple a { for uint i in [0:2] { h a; } }
            triple q[0];
            """
        );

        CompositeQuantumGate gate = (CompositeQuantumGate) operations(circuit).getFirst();
        assertEquals(3, gate.expandToElementary().size());
        assertTrue(circuit.getLoopBlocks().isEmpty());
    }

    /**
     * The discarded passes give their share of the operation budget back. Without that, a long
     * repetition would eat the allowance for the rest of the file although only one copy of its
     * body ends up in the circuit. (The peak during unrolling is still bounded — this refund is
     * about what the loop leaves behind, not about lifting the cap.)
     */
    @Test
    void discardedPassesGiveTheOperationBudgetBack() {
        String code =
            """
                qubit[1] q;
                for uint i in [0:899] { h q[0]; x q[0]; }
                """ +
            "y q[0];\n".repeat(300);

        QuantumCircuit circuit = parse(code);

        // 900 passes x 2 gates = 1800 charged, refunded to 2, so the 300 trailing gates still fit
        // under the 2000-operation cap.
        assertEquals(302, operations(circuit).size());
        assertEquals(900, circuit.getLoopBlocks().getFirst().getRepeatCount());
    }

    /** The column a member leaves free on its own wire must not be usable by an outsider. */
    @Test
    void anOutsiderIsPushedOutOfTheFrame() {
        QuantumCircuit circuit = parse(
            """
            qubit[4] q;
            x q[0];
            for int i in [0:2] {
                cx q[2], q[1];
                cx q[2], q[0];
                ccx q[0], q[1], q[2];
            }
            """
        );

        // The first CX only occupies wires 1..2, so without a reservation the X would slide into its
        // column — inside a frame that spans wires 0..2 because the other two gates reach q[0].
        assertEquals(List.of("X"), identifiersInColumn(circuit, 0));
        assertEquals(List.of("CX"), identifiersInColumn(circuit, 1));
        assertFramesContainOnlyTheirMembers(circuit);
    }

    /** Outside the frame's wire span there is nothing to protect, so the column stays shared. */
    @Test
    void aGateBesideTheFrameKeepsItsColumn() {
        QuantumCircuit circuit = parse(
            """
            qubit[4] q;
            h q[3];
            for int i in [0:2] {
                cx q[2], q[1];
                cx q[2], q[0];
                ccx q[0], q[1], q[2];
            }
            """
        );

        assertEquals(List.of("H", "CX"), identifiersInColumn(circuit, 0));
        assertFramesContainOnlyTheirMembers(circuit);
    }

    /** A gate after the loop may not slip back into a gap either. */
    @Test
    void aLaterGateStaysBehindTheFrame() {
        QuantumCircuit circuit = parse(
            """
            qubit[4] q;
            for int i in [0:2] {
                cx q[2], q[1];
                cx q[2], q[0];
                ccx q[0], q[1], q[2];
            }
            x q[0];
            """
        );

        assertFramesContainOnlyTheirMembers(circuit);
        assertEquals(3, circuit.getLayers().size() - 1, "The frame keeps its three columns, the X follows behind.");
        assertEquals(List.of("X"), identifiersInColumn(circuit, 3));
    }

    /** Nested frames have to hold as well, each against the members of the loop around it. */
    @Test
    void nestedFramesAlsoContainOnlyTheirMembers() {
        QuantumCircuit circuit = parse(
            """
            qubit[3] q;
            for int i in [0:1] {
                h q[0];
                for int j in [0:1] { cx q[0], q[1]; h q[2]; }
            }
            """
        );

        assertEquals(2, circuit.getLoopBlocks().size());
        assertFramesContainOnlyTheirMembers(circuit);
    }

    /** Two loops in a row each get their own frame, over their own operations. */
    @Test
    void separateLoopsGetSeparateFrames() {
        QuantumCircuit circuit = parse(
            """
            qubit[2] q;
            for uint i in [0:1] { h q[0]; }
            for uint i in [0:2] { x q[1]; }
            """
        );

        assertEquals(2, circuit.getLoopBlocks().size());
        LoopBlock first = circuit.getLoopBlocks().get(0);
        LoopBlock second = circuit.getLoopBlocks().get(1);
        assertEquals(2, first.getRepeatCount());
        assertEquals(3, second.getRepeatCount());
        assertEquals(1, first.getOperationIds().size());
        assertEquals(1, second.getOperationIds().size());
        assertFalse(first.getOperationIds().stream().anyMatch(second::covers), "The frames must not share operations.");
    }
}
