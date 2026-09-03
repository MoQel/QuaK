package edu.kit.quak.core.circuit.codegen;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Emitting {@code gate} declarations.
 *
 * <p>Until this existed the generator wrote calls to gates it never declared, so the code it
 * produced could not be read back — the round trip below is the actual point of the feature.
 */
@UnitTest
class QasmGateDeclarationTest {

    private QuantumCircuit parse(String code) {
        return new QasmService().parse(code);
    }

    /** Parses the generated code again; anything undeclared blows up right here. */
    private QuantumCircuit roundTrip(String code) {
        return parse(QasmCodeGenerator.toCode(parse(code)));
    }

    private List<QuantumOperation> elementaryOperations(QuantumCircuit circuit) {
        List<QuantumOperation> operations = new ArrayList<>();
        for (var layer : circuit.getLayers()) {
            for (var operation : layer.getQuantumOperations()) {
                if (operation instanceof CompositeQuantumGate composite) {
                    operations.addAll(composite.expandToElementary());
                } else {
                    operations.add(operation);
                }
            }
        }
        return operations;
    }

    private List<String> elementaryIdentifiers(QuantumCircuit circuit) {
        return elementaryOperations(circuit)
            .stream()
            .map(operation -> ((ElementaryQuantumGate) operation).getOperationDefinition().name())
            .toList();
    }

    @Test
    void aCustomGateIsDeclaredBeforeItIsCalled() {
        String code = QasmCodeGenerator.toCode(
            parse(
                """
                qubit[2] q;
                gate bell a, b { h a; cx a, b; }
                bell q[0], q[1];
                """
            )
        );

        assertTrue(code.contains("gate bell a, b {"), "Missing declaration in:\n" + code);
        assertTrue(code.indexOf("gate bell") < code.indexOf("bell q[0]"), "Declaration must precede the call:\n" + code);
    }

    @Test
    void aCustomGateSurvivesTheRoundTrip() {
        QuantumCircuit circuit = roundTrip(
            """
            qubit[2] q;
            gate bell a, b { h a; cx a, b; }
            bell q[0], q[1];
            """
        );

        assertEquals(List.of("H", "CX"), elementaryIdentifiers(circuit));
        assertTrue(
            circuit
                .getLayers()
                .stream()
                .flatMap(l -> l.getQuantumOperations().stream())
                .anyMatch(CompositeQuantumGate.class::isInstance)
        );
    }

    /** A gate body is a sequence, so it must not be reordered by qubit the way a layer is. */
    @Test
    void aBodyKeepsItsProgramOrder() {
        String code = QasmCodeGenerator.toCode(
            parse(
                """
                qubit[2] q;
                gate flip a, b { x b; cz a, b; }
                flip q[0], q[1];
                """
            )
        );

        assertTrue(code.indexOf("x b;") < code.indexOf("cz a, b;"), "Body order changed:\n" + code);
    }

    @Test
    void nestedGatesAreDeclaredInnermostFirst() {
        String code = QasmCodeGenerator.toCode(
            parse(
                """
                qubit[3] q;
                gate bell a, b { h a; cx a, b; }
                gate ghz a, b, c { bell a, b; cx b, c; }
                ghz q[0], q[1], q[2];
                """
            )
        );

        assertTrue(code.indexOf("gate bell") < code.indexOf("gate ghz"), "Dependency must come first:\n" + code);
        assertEquals(
            List.of("H", "CX", "CX"),
            elementaryIdentifiers(
                roundTrip(
                    """
                    qubit[3] q;
                    gate bell a, b { h a; cx a, b; }
                    gate ghz a, b, c { bell a, b; cx b, c; }
                    ghz q[0], q[1], q[2];
                    """
                )
            )
        );
    }

    /**
     * Two calls of one gate come back from the database as two equal definitions. Declaring each
     * would be "Gate is defined more than once", so they have to collapse onto one declaration.
     */
    @Test
    void equalDefinitionsShareOneDeclaration() {
        String code = QasmCodeGenerator.toCode(
            parse(
                """
                qubit[4] q;
                gate bell a, b { h a; cx a, b; }
                bell q[0], q[1];
                bell q[2], q[3];
                """
            )
        );

        assertEquals(1, code.split("gate bell", -1).length - 1, "Expected exactly one declaration in:\n" + code);
        // And it still reads back.
        assertEquals(4, elementaryIdentifiers(parse(code)).size());
    }

    /**
     * A gate parametrized by an angle yields one definition per argument value — same name,
     * different body. Declaring only the first would silently change what the second call does.
     */
    @Test
    void differentDefinitionsSharingANameAreDisambiguated() {
        QuantumCircuit original = parse(
            """
            qubit[2] q;
            gate rot(theta) a { rz(theta) a; }
            rot(pi / 4) q[0];
            rot(pi / 2) q[1];
            """
        );
        String code = QasmCodeGenerator.toCode(original);

        assertTrue(code.contains("gate rot a {"), "Missing first declaration in:\n" + code);
        assertTrue(code.contains("gate rot_2 a {"), "Missing disambiguated declaration in:\n" + code);

        // Both rotations survive; the angles are what tells the two gates apart.
        List<Double> angles = elementaryOperations(parse(code))
            .stream()
            .map(operation -> ((edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate) operation).getRotationAngle())
            .sorted()
            .toList();
        assertEquals(2, angles.size());
        assertEquals(Math.PI / 4, angles.get(0), 1e-9);
        assertEquals(Math.PI / 2, angles.get(1), 1e-9);
    }

    @Test
    void aCircuitWithoutCustomGatesIsUnchanged() {
        String code = QasmCodeGenerator.toCode(
            parse(
                """
                qubit[2] q;
                h q[0];
                cx q[0], q[1];
                """
            )
        );

        assertTrue(!code.contains("gate "), "No declaration expected in:\n" + code);
        assertEquals(List.of("H", "CX"), elementaryIdentifiers(parse(code)));
    }
}
