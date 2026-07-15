package edu.kit.quak.application.parser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.circuit.antlr.OpenQASM3Lexer;
import edu.kit.quak.application.circuit.antlr.OpenQASM3Parser;
import edu.kit.quak.application.circuit.antlr.QasmCircuitVisitor;
import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import edu.kit.quak.core.circuit.codegen.QasmCodeGenerator;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.List;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class QasmTest {

    @Test
    void testQasmParser() {
        String qasmCode = """
                /*
                 * quantum ripple-carry adder
                 * Cuccaro et al, quant-ph/0410184
                 */
                OPENQASM 3;
                include "stdgates.inc";

                gate majority a, b, c {
                    cx c, b;
                    cx c, a;
                    ccx a, b, c;
                }

                gate unmaj a, b, c {
                    ccx a, b, c;
                    cx c, a;
                    cx a, b;
                }

                qubit[1] cin;
                qubit[4] a;
                qubit[4] b;
                qubit[1] cout;
                bit[5] ans;
                uint[4] a_in = 1;  // a = 0001
                uint[4] b_in = 15; // b = 1111
                // initialize qubits
                reset cin;
                reset a;
                reset b;
                reset cout;

                // set input states
                for int i in [0: 3] {
                  if(bool(a_in[i])) x a[i];
                  if(bool(b_in[i])) x b[i];
                }
                // add a to b, storing result in b
                majority cin[0], b[0], a[0];
                for int i in [0: 2] { majority a[i], b[i + 1], a[i + 1]; }
                cx a[3], cout[0];
                for int i in [2: -1: 0] { unmaj a[i], b[i + 1], a[i + 1]; }
                unmaj cin[0], b[0], a[0];
                measure b[0:3] -> ans[0:3];
                measure cout[0] -> ans[4];
            """;

        String qasmCode2 = """
            // Qubit-Deklarationen
            qubit[3] q;   // Array mit 3 Qubits
            qubit r;      // Einzelqubit

            // Gate-Aufrufe
            x q[0];       // Gate X auf q0
            cx q[0], q[1]; // CNOT zwischen q0 und q1
            gphase(pi) r; // GPHASE auf r
            """;

        String qasmCode3 = """
            OPENQASM 3.0;
            include "stdgates.inc";

            qubit[2] q;
            bit[2] c;

            // Put the first qubit in superposition
            h q[0];

            // Entangle the first qubit with the second using CNOT
            cx q[0], q[1];

            // Measure both qubits
            c[0] = measure q[0];
            c[1] = measure q[1];

            """;

        CharStream input = CharStreams.fromString(qasmCode3);
        OpenQASM3Lexer lexer = new OpenQASM3Lexer(input);
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        OpenQASM3Parser parser = new OpenQASM3Parser(tokens);

        ParseTree tree = parser.program();
        System.out.println("Tree");
        System.out.println(tree.toStringTree());

        QasmCircuitVisitor visitor = new QasmCircuitVisitor();
        visitor.visit(tree);
        System.out.println("Circuit");
        System.out.println(visitor.getCircuit());
    }

    @Test
    void rotationGateAnglesAreParsed() {
        QasmService qasmService = new QasmService();
        String qasmCode = """
            qubit[3] q;
            rx(pi/2) q[0];
            ry(pi) q[1];
            rz(-pi/4) q[2];
            """;

        QuantumCircuit circuit = qasmService.parse(qasmCode);

        // ASAP-Scheduling kann die Reihenfolge ändern, daher winkelweise (sortiert) vergleichen.
        List<Double> actual = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                if (operation instanceof ElementaryQuantumGate gate) {
                    actual.add(gate.getRotationAngle());
                }
            }
        }
        actual.sort(Double::compareTo);

        List<Double> expected = new ArrayList<>(List.of(-Math.PI / 4, Math.PI / 2, Math.PI));
        assertEquals(expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++) {
            assertEquals(expected.get(i), actual.get(i), 1e-9);
        }
    }

    @Test
    void rotationGateAngleSurvivesCodeRoundTrip() {
        QasmService qasmService = new QasmService();
        QuantumCircuit circuit = qasmService.parse("qubit[1] q;\nrx(pi/2) q[0];\n");

        String generatedCode = QasmCodeGenerator.toCode(circuit);

        assertTrue(generatedCode.contains("rx(pi/2)"), "Generated code should keep the symbolic angle: " + generatedCode);

        // Round-trip: re-parsing the generated code yields the same angle.
        QuantumCircuit reparsed = qasmService.parse(generatedCode);
        ElementaryQuantumGate gate = (ElementaryQuantumGate) reparsed.getLayers().getFirst().getQuantumOperations().getFirst();
        assertEquals(Math.PI / 2, gate.getRotationAngle(), 1e-9);
    }

    @Test
    void registerIsSizedFromDeclaration() {
        // A declared size below the previous default (4) must shrink the register, not keep 4.
        QuantumCircuit circuit = new QasmService().parse("qubit[2] q;\n");

        assertEquals(1, circuit.getRegisters().size());
        Register register = circuit.getRegisters().getFirst();
        assertEquals("q", register.getName());
        assertEquals(2, ((QuantumRegister) register).getNumberOfQubits());
    }

    @Test
    void registerWithNonDefaultNameIsCreated() {
        // Registers with a name other than "q" must be created (previously silently ignored).
        QuantumCircuit circuit = new QasmService().parse("qubit[3] alice;\nx alice[0];\n");

        Register register = circuit.getRegisterByName("alice").orElseThrow();
        assertEquals(3, ((QuantumRegister) register).getNumberOfQubits());
        assertEquals(1, circuit.getLayers().size());
    }

    @Test
    void controlAndTargetAreSplitViaGateDefinition() {
        QuantumCircuit circuit = new QasmService().parse("qubit[2] q;\ncx q[0], q[1];\n");

        ElementaryQuantumGate gate = (ElementaryQuantumGate) circuit.getLayers().getFirst().getQuantumOperations().getFirst();
        assertEquals(1, gate.getControlQubits().size());
        assertEquals(0, gate.getControlQubits().getFirst().getIndex());
        assertEquals(1, gate.getTargetQubits().size());
        assertEquals(1, gate.getTargetQubits().getFirst().getIndex());
    }

    @Test
    void eulerAndTauSurviveCodeRoundTrip() {
        QasmService qasmService = new QasmService();
        QuantumCircuit circuit = qasmService.parse("qubit[2] q;\nrx(euler) q[0];\nry(tau) q[1];\n");

        String generatedCode = QasmCodeGenerator.toCode(circuit);
        assertTrue(generatedCode.contains("rx(euler)"), "Generated code should keep 'euler': " + generatedCode);
        assertTrue(generatedCode.contains("ry(tau)"), "Generated code should keep 'tau': " + generatedCode);

        // Round-trip: re-parsing the generated code yields the same angles.
        QuantumCircuit reparsed = qasmService.parse(generatedCode);
        List<Double> angles = new ArrayList<>();
        for (var layer : reparsed.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                if (operation instanceof ElementaryQuantumGate gate) {
                    angles.add(gate.getRotationAngle());
                }
            }
        }
        angles.sort(Double::compareTo);
        assertEquals(2, angles.size());
        assertEquals(Math.E, angles.get(0), 1e-9);
        assertEquals(Math.TAU, angles.get(1), 1e-9);
    }

    @Test
    void invalidCodeThrowsQasmParseException() {
        QasmService qasmService = new QasmService();

        // Unknown gate name.
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[1] q;\nfoo q[0];\n"));
        // Non-constant (variable) qubit index.
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[2] q;\ncx q[i], q[i + 1];\n"));
        // Syntax error.
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[1] q\nx q[0]\n"));
    }

    @Test
    void forLoopOverRangeIsUnrolledWithInclusiveStop() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[5] q;
            for uint i in [0:4] { h q[i]; }
            """
        );

        // [0:4] is inclusive in OpenQASM 3 → 5 iterations, one H per qubit.
        assertEquals(List.of(0, 1, 2, 3, 4), collectSingleTargetIndices(circuit));
    }

    @Test
    void forLoopWithStepIsUnrolled() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[5] q;
            for uint i in [0:2:4] { x q[i]; }
            """
        );

        assertEquals(List.of(0, 2, 4), collectSingleTargetIndices(circuit));
    }

    @Test
    void forLoopWithNegativeStepIsUnrolled() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[5] q;
            for int i in [4:-2:0] { x q[i]; }
            """
        );

        assertEquals(List.of(0, 2, 4), collectSingleTargetIndices(circuit));
    }

    @Test
    void forLoopOverSetIsUnrolled() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[5] q;
            for uint i in {0, 3, 1} { x q[i]; }
            """
        );

        assertEquals(List.of(0, 1, 3), collectSingleTargetIndices(circuit));
    }

    @Test
    void loopVariableWorksInIndexExpressions() {
        // GHZ chain: the loop variable appears in both operands, once inside an arithmetic expression.
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[4] q;
            h q[0];
            for uint i in [0:2] { cx q[i], q[i + 1]; }
            """
        );

        List<int[]> cxPairs = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                if (operation instanceof ElementaryQuantumGate gate && !gate.getControlQubits().isEmpty()) {
                    cxPairs.add(new int[] { gate.getControlQubits().getFirst().getIndex(), gate.getTargetQubits().getFirst().getIndex() });
                }
            }
        }
        cxPairs.sort((a, b) -> Integer.compare(a[0], b[0]));
        assertEquals(3, cxPairs.size());
        for (int i = 0; i < 3; i++) {
            assertEquals(i, cxPairs.get(i)[0]);
            assertEquals(i + 1, cxPairs.get(i)[1]);
        }
    }

    @Test
    void loopVariableWorksInRotationAngles() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[3] q;
            for uint i in [0:2] { rx(i * pi / 2) q[i]; }
            """
        );

        List<Double> angles = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                angles.add(((ElementaryQuantumGate) operation).getRotationAngle());
            }
        }
        angles.sort(Double::compareTo);
        assertEquals(3, angles.size());
        assertEquals(0.0, angles.get(0), 1e-9);
        assertEquals(Math.PI / 2, angles.get(1), 1e-9);
        assertEquals(Math.PI, angles.get(2), 1e-9);
    }

    @Test
    void forLoopBodyWithoutBracesIsSupported() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[3] q;
            for uint i in [0:2] h q[i];
            """
        );

        assertEquals(List.of(0, 1, 2), collectSingleTargetIndices(circuit));
    }

    @Test
    void nestedForLoopsAreUnrolled() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[4] q;
            for uint i in [0:1] { for uint j in [0:1] { x q[2 * i + j]; } }
            """
        );

        assertEquals(List.of(0, 1, 2, 3), collectSingleTargetIndices(circuit));
    }

    @Test
    void constDeclarationCanBeUsedInLoopBoundsAndRegisterSize() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            const uint n = 3;
            qubit[n] q;
            for uint i in [0:n - 1] { h q[i]; }
            """
        );

        assertEquals(3, ((QuantumRegister) circuit.getRegisters().getFirst()).getNumberOfQubits());
        assertEquals(List.of(0, 1, 2), collectSingleTargetIndices(circuit));
    }

    @Test
    void emptyRangeProducesNoOperations() {
        // Start beyond stop with a positive step → zero iterations, not an error.
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[1] q;
            for uint i in [3:0] { h q[0]; }
            """
        );

        assertEquals(0, circuit.getLayers().size());
    }

    @Test
    void unsupportedLoopFormsAreRejected() {
        QasmService qasmService = new QasmService();

        // Open-ended range (only legal in register slicing, not in for loops).
        QasmParseException openRange = assertThrows(QasmParseException.class, () ->
            qasmService.parse("qubit[3] q;\nfor uint i in [:2] { h q[i]; }\n")
        );
        assertTrue(openRange.getMessage().contains("start and stop"), "Unexpected message: " + openRange.getMessage());
        // Step 0 would never terminate.
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[3] q;\nfor uint i in [0:0:2] { h q[i]; }\n"));
        // Iteration over an array (runtime values).
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[1] q;\nfor float x in angles { rx(x) q[0]; }\n"));
        // Non-constant loop bound.
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[3] q;\nfor uint i in [0:m] { h q[i]; }\n"));
    }

    @Test
    void runtimeControlFlowIsRejected() {
        QasmService qasmService = new QasmService();

        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[1] q;\nwhile (true) { h q[0]; }\n"));
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[1] q;\nfor uint i in [0:2] { break; }\n"));
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[1] q;\nfor uint i in [0:2] { continue; }\n"));
        assertThrows(QasmParseException.class, () -> qasmService.parse("def f(qubit q) { h q; }\n"));
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[2] q;\nctrl @ x q[0], q[1];\n"));
    }

    @Test
    void loopIterationBudgetIsEnforced() {
        QasmService qasmService = new QasmService();

        // A single huge range must fail fast instead of materializing the circuit.
        QasmParseException hugeRange = assertThrows(QasmParseException.class, () ->
            qasmService.parse("qubit[1] q;\nfor uint i in [0:100000] { h q[0]; }\n")
        );
        assertTrue(hugeRange.getMessage().contains("limit"), "Unexpected message: " + hugeRange.getMessage());
        // Nested loops multiply: 200 × 200 body executions exceed the budget as well.
        QasmParseException nested = assertThrows(QasmParseException.class, () ->
            qasmService.parse("qubit[1] q;\nfor uint i in [0:199] { for uint j in [0:199] { h q[0]; } }\n")
        );
        assertTrue(nested.getMessage().contains("limit"), "Unexpected message: " + nested.getMessage());
    }

    @Test
    void customGateIsInlined() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            gate bell a, b {
                h a;
                cx a, b;
            }
            qubit[2] q;
            bell q[0], q[1];
            """
        );

        assertEquals(List.of("CX", "H"), sortedIdentifiers(circuit));

        ElementaryQuantumGate cx = (ElementaryQuantumGate) findOperation(circuit, "CX");
        assertEquals(0, cx.getControlQubits().getFirst().getIndex());
        assertEquals(1, cx.getTargetQubits().getFirst().getIndex());
    }

    @Test
    void customGateFormalQubitsShadowRegistersOfTheSameName() {
        // The gate's formal 'a'/'b' must win over the same-named registers, otherwise the body
        // would silently operate on a[0]/b[0] instead of the passed operands.
        QuantumCircuit circuit = new QasmService().parse(
            """
            gate flip a, b {
                cx a, b;
            }
            qubit[2] a;
            qubit[2] b;
            flip a[1], b[1];
            """
        );

        ElementaryQuantumGate cx = (ElementaryQuantumGate) findOperation(circuit, "CX");
        String registerA = circuit.getRegisterByName("a").orElseThrow().getId();
        String registerB = circuit.getRegisterByName("b").orElseThrow().getId();
        assertEquals(registerA, cx.getControlQubits().getFirst().getRegisterId());
        assertEquals(1, cx.getControlQubits().getFirst().getIndex());
        assertEquals(registerB, cx.getTargetQubits().getFirst().getRegisterId());
        assertEquals(1, cx.getTargetQubits().getFirst().getIndex());
    }

    @Test
    void customGateParameterIsBoundInBody() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            gate myrot(theta) q {
                rx(theta / 2) q;
            }
            qubit[1] q;
            myrot(pi) q[0];
            """
        );

        ElementaryQuantumGate rx = (ElementaryQuantumGate) findOperation(circuit, "RX");
        assertEquals(Math.PI / 2, rx.getRotationAngle(), 1e-9);
    }

    @Test
    void nestedCustomGatesAreInlined() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            gate inner a, b {
                cx a, b;
            }
            gate outer a, b {
                inner a, b;
                inner b, a;
            }
            qubit[2] q;
            outer q[0], q[1];
            """
        );

        assertEquals(List.of("CX", "CX"), sortedIdentifiers(circuit));
    }

    @Test
    void loopVariableWorksInCustomGateOperands() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            gate link a, b {
                cx a, b;
            }
            qubit[4] q;
            for uint i in [0:2] { link q[i], q[i + 1]; }
            """
        );

        assertEquals(List.of("CX", "CX", "CX"), sortedIdentifiers(circuit));
    }

    @Test
    void invalidCustomGateUsageIsRejected() {
        QasmService qasmService = new QasmService();

        // Recursion would never terminate.
        assertThrows(QasmParseException.class, () -> qasmService.parse("gate loop a { loop a; }\nqubit[1] q;\nloop q[0];\n"));
        // Indirect recursion.
        assertThrows(QasmParseException.class, () ->
            qasmService.parse("gate ping a { pong a; }\ngate pong a { ping a; }\nqubit[1] q;\nping q[0];\n")
        );
        // A gate body may only use its formal qubits, not registers.
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[2] q;\ngate bad a { x q[0]; }\nbad q[0];\n"));
        // Wrong number of operands.
        assertThrows(QasmParseException.class, () -> qasmService.parse("gate pair a, b { cx a, b; }\nqubit[2] q;\npair q[0];\n"));
        // Wrong number of parameters.
        assertThrows(QasmParseException.class, () -> qasmService.parse("gate rot(t) a { rx(t) a; }\nqubit[1] q;\nrot q[0];\n"));
        // The same qubit passed twice.
        assertThrows(QasmParseException.class, () -> qasmService.parse("gate pair a, b { cx a, b; }\nqubit[2] q;\npair q[0], q[0];\n"));
        // Redefining a built-in gate.
        assertThrows(QasmParseException.class, () -> qasmService.parse("gate h a { x a; }\nqubit[1] q;\nh q[0];\n"));
        // Defining the same gate twice.
        assertThrows(QasmParseException.class, () -> qasmService.parse("gate g a { x a; }\ngate g a { y a; }\nqubit[1] q;\ng q[0];\n"));
    }

    @Test
    void constantIfIsFolded() {
        // a_in = 1 = 0b0001, so only bit 0 is set and only a[0] gets an X.
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[4] a;
            uint[4] a_in = 1;
            for int i in [0:3] {
                if (bool(a_in[i])) x a[i];
            }
            """
        );

        assertEquals(List.of(0), collectSingleTargetIndices(circuit));
    }

    @Test
    void constantIfElseIsFolded() {
        QuantumCircuit circuit = new QasmService().parse(
            """
            qubit[2] q;
            const int n = 5;
            if (n > 3) { h q[0]; } else { x q[1]; }
            if (n == 0) { h q[1]; } else { x q[0]; }
            """
        );

        assertEquals(List.of("H", "X"), sortedIdentifiers(circuit));
    }

    @Test
    void nonConstantConditionIsRejected() {
        QasmService qasmService = new QasmService();

        // 'c' has no constant value, so the branch cannot be decided at parse time.
        QasmParseException ex = assertThrows(QasmParseException.class, () ->
            qasmService.parse("qubit[1] q;\nbit c;\nif (c == 1) { h q[0]; }\n")
        );
        assertTrue(ex.getMessage().contains("compile-time constant"), "Unexpected message: " + ex.getMessage());

        // Assigning to a variable invalidates its constant value.
        assertThrows(QasmParseException.class, () ->
            qasmService.parse("qubit[1] q;\nuint[4] v = 1;\nv = 2;\nif (bool(v[0])) { h q[0]; }\n")
        );
        // Bit index beyond the declared width.
        assertThrows(QasmParseException.class, () -> qasmService.parse("qubit[1] q;\nuint[4] v = 1;\nif (bool(v[9])) { h q[0]; }\n"));
    }

    @Test
    void rippleCarryAdderIsParsed() {
        // Cuccaro et al, quant-ph/0410184 — exercises custom gates, loops and constant folding at
        // once. Measurements and classical registers are not represented yet and are dropped.
        QuantumCircuit circuit = new QasmService().parse(
            """
            OPENQASM 3;
            include "stdgates.inc";

            gate majority a, b, c {
                cx c, b;
                cx c, a;
                ccx a, b, c;
            }

            gate unmaj a, b, c {
                ccx a, b, c;
                cx c, a;
                cx a, b;
            }

            qubit[1] cin;
            qubit[4] a;
            qubit[4] b;
            qubit[1] cout;
            bit[5] ans;
            uint[4] a_in = 1;  // a = 0001
            uint[4] b_in = 15; // b = 1111

            reset cin;
            reset a;
            reset b;
            reset cout;

            // set input states
            for int i in [0: 3] {
                if(bool(a_in[i])) x a[i];
                if(bool(b_in[i])) x b[i];
            }
            // add a to b, storing result in b
            majority cin[0], b[0], a[0];
            for int i in [0: 2] { majority a[i], b[i + 1], a[i + 1]; }
            cx a[3], cout[0];
            for int i in [2: -1: 0] { unmaj a[i], b[i + 1], a[i + 1]; }
            unmaj cin[0], b[0], a[0];
            measure b[0:3] -> ans[0:3];
            measure cout[0] -> ans[4];
            """
        );

        assertEquals(List.of("cin", "a", "b", "cout"), circuit.getRegisters().stream().map(Register::getName).toList());

        // 4 majority + 4 unmaj inline to 2 CX + 1 CCX each, plus the standalone cx a[3], cout[0].
        List<String> identifiers = sortedIdentifiers(circuit);
        assertEquals(8, identifiers.stream().filter("CCX"::equals).count(), "CCX count");
        assertEquals(17, identifiers.stream().filter("CX"::equals).count(), "CX count");
        assertEquals(5, identifiers.stream().filter("X"::equals).count(), "X count");
        assertEquals(30, identifiers.size(), "total operations");

        // The folded ifs set a = 0001 and b = 1111.
        String registerA = circuit.getRegisterByName("a").orElseThrow().getId();
        String registerB = circuit.getRegisterByName("b").orElseThrow().getId();
        List<String> xTargets = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                if (operation.getOperationDefinition().name().equals("X")) {
                    var target = operation.getTargetQubits().getFirst();
                    String register = target.getRegisterId().equals(registerA) ? "a" : target.getRegisterId().equals(registerB) ? "b" : "?";
                    xTargets.add(register + "[" + target.getIndex() + "]");
                }
            }
        }
        xTargets.sort(String::compareTo);
        assertEquals(List.of("a[0]", "b[0]", "b[1]", "b[2]", "b[3]"), xTargets);
    }

    @Test
    void oldStyleQregDeclarationsAreParsed() {
        // `qreg`/`creg` are OpenQASM 2 syntax that the grammar still accepts; without a handler they
        // parsed silently and the first gate call failed with "unknown qubit register".
        QuantumCircuit circuit = new QasmService().parse(
            """
            OPENQASM 2.0;
            include "qelib1.inc";
            qreg a[2];
            qreg single;
            creg ans[5];
            x a[0];
            cx a[0], a[1];
            """
        );

        // creg is dropped: classical registers have no editor representation yet.
        assertEquals(List.of("a", "single"), circuit.getRegisters().stream().map(Register::getName).toList());
        assertEquals(2, ((QuantumRegister) circuit.getRegisterByName("a").orElseThrow()).getNumberOfQubits());
        assertEquals(1, ((QuantumRegister) circuit.getRegisterByName("single").orElseThrow()).getNumberOfQubits());
        assertEquals(List.of("CX", "X"), sortedIdentifiers(circuit));
    }

    @Test
    void openQasm2RippleCarryAdderIsParsed() {
        // Same circuit as rippleCarryAdderIsParsed, but in OpenQASM 2 form: qreg/creg declarations
        // and explicitly written-out gate calls instead of loops and constant folding.
        QuantumCircuit circuit = new QasmService().parse(
            """
            // quantum ripple-carry adder
            // Cuccaro et al, quant-ph/0410184
            OPENQASM 2.0;
            include "qelib1.inc";

            gate majority a, b, c
            {
              cx c, b;
              cx c, a;
              ccx a, b, c;
            }

            gate unmaj a, b, c
            {
              ccx a, b, c;
              cx c, a;
              cx a, b;
            }

            qreg cin[1];
            qreg a[4];
            qreg b[4];
            qreg cout[1];
            creg ans[5];

            // set input states: a = 0001, b = 1111
            x a[0];
            x b[0];
            x b[1];
            x b[2];
            x b[3];

            // add a to b, storing result in b
            majority cin[0], b[0], a[0];
            majority a[0], b[1], a[1];
            majority a[1], b[2], a[2];
            majority a[2], b[3], a[3];
            cx a[3], cout[0];
            unmaj a[2], b[3], a[3];
            unmaj a[1], b[2], a[2];
            unmaj a[0], b[1], a[1];
            unmaj cin[0], b[0], a[0];

            measure b[0] -> ans[0];
            measure b[1] -> ans[1];
            measure b[2] -> ans[2];
            measure b[3] -> ans[3];
            measure cout[0] -> ans[4];
            """
        );

        assertEquals(List.of("cin", "a", "b", "cout"), circuit.getRegisters().stream().map(Register::getName).toList());

        List<String> identifiers = sortedIdentifiers(circuit);
        assertEquals(8, identifiers.stream().filter("CCX"::equals).count(), "CCX count");
        assertEquals(17, identifiers.stream().filter("CX"::equals).count(), "CX count");
        assertEquals(5, identifiers.stream().filter("X"::equals).count(), "X count");
        assertEquals(30, identifiers.size(), "total operations");
    }

    /** All operation identifiers in the circuit, sorted so ASAP scheduling cannot flake the test. */
    private List<String> sortedIdentifiers(QuantumCircuit circuit) {
        List<String> identifiers = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                identifiers.add(operation.getOperationDefinition().name());
            }
        }
        identifiers.sort(String::compareTo);
        return identifiers;
    }

    private QuantumOperation findOperation(QuantumCircuit circuit, String identifier) {
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                if (operation.getOperationDefinition().name().equals(identifier)) {
                    return operation;
                }
            }
        }
        throw new AssertionError("No " + identifier + " operation in circuit");
    }

    /** Collects the target qubit index of every single-target operation in the circuit, sorted ascending. */
    private List<Integer> collectSingleTargetIndices(QuantumCircuit circuit) {
        List<Integer> indices = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                indices.add(operation.getTargetQubits().getFirst().getIndex());
            }
        }
        indices.sort(Integer::compareTo);
        return indices;
    }
}
