package edu.kit.quak.application.parser.qasm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.circuit.antlr.OpenQASM3Lexer;
import edu.kit.quak.application.circuit.antlr.OpenQASM3Parser;
import edu.kit.quak.application.circuit.antlr.QasmCircuitVisitor;
import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
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

        String generatedCode = circuit.toCode();

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

        String generatedCode = circuit.toCode();
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
}
