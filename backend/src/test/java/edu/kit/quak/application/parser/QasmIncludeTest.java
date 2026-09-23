package edu.kit.quak.application.parser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import edu.kit.quak.application.circuit.ports.out.QasmIncludeLoader;
import edu.kit.quak.application.circuit.ports.out.QasmSource;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/**
 * Covers resolving {@code include "..."} against other files of the project. The loader is faked
 * here so the parser can be tested without the filesystem domain; wiring it to real files is the
 * job of {@code ProjectQasmIncludeResolver}.
 */
@UnitTest
class QasmIncludeTest {

    private final QasmService service = new QasmService();

    /** In-memory stand-in for the project's file tree, keyed by "fileId" and by name. */
    private static final class FakeFiles implements QasmIncludeLoader {

        private final Map<String, String> byName = new HashMap<>();
        private final Map<String, String> circuitIdsByName = new HashMap<>();

        FakeFiles add(String name, String code) {
            byName.put(name, code);
            return this;
        }

        FakeFiles addCircuit(String name, String circuitId) {
            circuitIdsByName.put(name, circuitId);
            return this;
        }

        @Override
        public Optional<QasmSource> load(String fromFileId, String path) {
            return Optional.ofNullable(byName.get(path)).map(code -> new QasmSource("f-" + path, path, code));
        }

        @Override
        public Optional<String> resolveCircuitId(String fromFileId, String path) {
            return Optional.ofNullable(circuitIdsByName.get(path));
        }
    }

    private static final String BELL_GATE = """
        OPENQASM 3.0;

        gate bell a, b {
            h a;
            cx a, b;
        }
        """;

    /**
     * The circuit's gates with user-defined ones expanded. An included `gate` is parsed into a
     * single composite, so these tests look at the expansion to assert what the gate resolved to.
     */
    private static String flatten(QuantumCircuit circuit) {
        return circuit
            .getLayers()
            .stream()
            .flatMap(layer -> layer.getQuantumOperations().stream())
            .flatMap(operation ->
                operation instanceof CompositeQuantumGate composite
                    ? composite.expandToElementary().stream()
                    : java.util.stream.Stream.of(operation)
            )
            .map(op -> ((ElementaryQuantumGate) op).getOperationDefinition())
            .map(Enum::name)
            .reduce((a, b) -> a + "," + b)
            .orElse("");
    }

    @Test
    void includesGateDefinitionFromAnotherFile() {
        String main = """
            OPENQASM 3.0;

            include "bell.qasm";

            qubit[2] q;

            bell q[0], q[1];
            """;

        QuantumCircuit circuit = service.parse(main, "f-main.qasm", new FakeFiles().add("bell.qasm", BELL_GATE));

        assertEquals("H,CX", flatten(circuit));
        assertEquals(1, circuit.getRegisters().size());
    }

    @Test
    void includesWorkInOpenQasm2Syntax() {
        String main = """
            OPENQASM 2.0;
            include "qelib1.inc";
            include "bell.qasm";

            qreg q[2];

            bell q[0], q[1];
            """;

        QuantumCircuit circuit = service.parse(main, "f-main.qasm", new FakeFiles().add("bell.qasm", BELL_GATE));

        assertEquals("H,CX", flatten(circuit));
    }

    @Test
    void resolvesNestedIncludes() {
        String middle = """
            OPENQASM 3.0;
            include "bell.qasm";

            gate bell3 a, b, c {
                bell a, b;
                cx b, c;
            }
            """;
        String main = """
            OPENQASM 3.0;
            include "middle.qasm";
            qubit[3] q;
            bell3 q[0], q[1], q[2];
            """;

        QuantumCircuit circuit = service.parse(main, "f-main.qasm", new FakeFiles().add("bell.qasm", BELL_GATE).add("middle.qasm", middle));

        assertEquals("H,CX,CX", flatten(circuit));
    }

    @Test
    void standardLibrariesNeedNoFile() {
        String main = """
            OPENQASM 3.0;
            include "stdgates.inc";
            qubit[1] q;
            h q[0];
            """;

        // No loader at all: the built-in libraries must still resolve.
        QuantumCircuit circuit = service.parse(main);

        assertEquals("H", flatten(circuit));
    }

    @Test
    void unknownIncludeIsReportedInsteadOfSilentlyIgnored() {
        String main = """
            OPENQASM 3.0;
            include "missing.qasm";
            qubit[1] q;
            """;

        QasmParseException ex = assertThrows(QasmParseException.class, () -> service.parse(main, "f-main.qasm", new FakeFiles()));

        assertTrue(ex.getMessage().contains("missing.qasm"), ex.getMessage());
    }

    @Test
    void includeWithoutFileContextIsReported() {
        String main = """
            OPENQASM 3.0;
            include "bell.qasm";
            qubit[2] q;
            """;

        // The content-only /parse endpoint has no fileId, so nothing can be resolved.
        QasmParseException ex = assertThrows(QasmParseException.class, () -> service.parse(main));

        assertTrue(ex.getMessage().contains("bell.qasm"), ex.getMessage());
    }

    @Test
    void circularIncludeIsRejected() {
        String a = """
            OPENQASM 3.0;
            include "b.qasm";
            """;
        String b = """
            OPENQASM 3.0;
            include "a.qasm";
            """;

        QasmParseException ex = assertThrows(QasmParseException.class, () ->
            service.parse(a, "f-a.qasm", new FakeFiles().add("a.qasm", a).add("b.qasm", b))
        );

        assertTrue(ex.getMessage().contains("Circular include"), ex.getMessage());
    }

    @Test
    void selfIncludeIsRejected() {
        String a = """
            OPENQASM 3.0;
            include "a.qasm";
            """;

        QasmParseException ex = assertThrows(QasmParseException.class, () ->
            service.parse(a, "f-a.qasm", new FakeFiles().add("a.qasm", a))
        );

        assertTrue(ex.getMessage().contains("Circular include"), ex.getMessage());
    }

    @Test
    void syntaxErrorInIncludedFileNamesThatFile() {
        String broken = """
            OPENQASM 3.0;
            gate bell a, b {
            """;
        String main = """
            OPENQASM 3.0;
            include "broken.qasm";
            """;

        QasmParseException ex = assertThrows(QasmParseException.class, () ->
            service.parse(main, "f-main.qasm", new FakeFiles().add("broken.qasm", broken))
        );

        assertTrue(ex.getMessage().contains("broken.qasm"), ex.getMessage());
    }

    @Test
    void resolvesSubcircuitCircuitIdFromProjectFileWhenOnlyFilenameGiven() {
        String main = """
            OPENQASM 3.0;

            @composition "hello_world.qasm"
            gate hello_world q0, q1, q2, q3 {
            }

            qubit[4] q;
            hello_world q[0], q[1], q[2], q[3];
            """;

        FakeFiles files = new FakeFiles().addCircuit("hello_world.qasm", "hw-circuit-uuid-123");
        QuantumCircuit circuit = service.parse(main, "f-main.qasm", files);

        assertEquals(1, circuit.getLayers().size());
        var op = circuit.getLayers().getFirst().getQuantumOperations().getFirst();
        assertTrue(op instanceof SubcircuitOperation);
        SubcircuitOperation subcircuit = (SubcircuitOperation) op;
        assertEquals("hw-circuit-uuid-123", subcircuit.getDefinitionCircuitId());
        assertEquals("hello_world.qasm", subcircuit.getDefinitionName());
    }

    @Test
    void keepsExplicitCircuitIdWhenProvidedInAnnotation() {
        String main = """
            OPENQASM 3.0;

            @composition "hello_world.qasm" explicit-id-456
            gate hello_world q0, q1 {
            }

            qubit[2] q;
            hello_world q[0], q[1];
            """;

        FakeFiles files = new FakeFiles().addCircuit("hello_world.qasm", "hw-circuit-uuid-123");
        QuantumCircuit circuit = service.parse(main, "f-main.qasm", files);

        assertEquals(1, circuit.getLayers().size());
        var op = circuit.getLayers().getFirst().getQuantumOperations().getFirst();
        assertTrue(op instanceof SubcircuitOperation);
        SubcircuitOperation subcircuit = (SubcircuitOperation) op;
        assertEquals("explicit-id-456", subcircuit.getDefinitionCircuitId());
        assertEquals("hello_world.qasm", subcircuit.getDefinitionName());
    }

    @Test
    void reportsMissingSubcircuitFileWhenParsedWithFileContext() {
        String main = """
            OPENQASM 3.0;

            @composition "missing.qasm"
            gate missing q0 {
            }

            qubit[1] q;
            missing q[0];
            """;

        QasmParseException ex = assertThrows(QasmParseException.class, () -> service.parse(main, "f-main.qasm", new FakeFiles()));

        assertTrue(ex.getMessage().contains("missing.qasm"), ex.getMessage());
    }
}
