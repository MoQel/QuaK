package edu.kit.quak.core.circuit.codegen;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.SubcircuitOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * How a subcircuit is named in generated code.
 *
 * <p>The name is cosmetic — the {@code @composition} annotation carries the id, which is what
 * identifies the circuit when the code is read back. But it was built from that id, so a circuit
 * came out as {@code comp_04dbd79b_a679_4a93_b2e2_8b6ddda849e3}, which nobody can read or type.
 * Names still have to be unique within the file: a gate declared twice is a parse error.
 */
@UnitTest
class QasmSubcircuitNamingTest {

    /** A circuit whose single register the given calls are bound to, by file name. */
    private static QuantumCircuit circuitCalling(String... circuitIdAndFileNamePairs) {
        QuantumRegister register = new QuantumRegister("q", 4);
        List<QuantumOperation> operations = new ArrayList<>();
        for (int i = 0; i < circuitIdAndFileNamePairs.length; i += 2) {
            operations.add(call(circuitIdAndFileNamePairs[i], circuitIdAndFileNamePairs[i + 1], register.getId()));
        }
        return QuantumCircuit.builder()
            .id("c")
            .projectId("p")
            .fileId("f")
            .registers(List.of(register))
            .layers(List.of(new Layer(operations)))
            .loopBlocks(List.of())
            .build();
    }

    private static SubcircuitOperation call(String circuitId, String fileName, String registerId) {
        SubcircuitOperation operation = new SubcircuitOperation(
            false,
            new ArrayList<>(List.of(new ElementSelector(registerId, 0), new ElementSelector(registerId, 1))),
            new ArrayList<>(),
            circuitId
        );
        operation.setDefinitionName(fileName);
        return operation;
    }

    private static String codeOf(QuantumCircuit circuit) {
        return QasmCodeGenerator.toCode(circuit);
    }

    @Test
    void namesTheGateAfterTheReferencedFile() {
        String code = codeOf(circuitCalling("id-1", "Bell State.qasm"));

        assertTrue(code.contains("gate bell_state "), code);
        assertTrue(code.contains("bell_state q[0], q[1];"), "the call uses the same name: " + code);
    }

    @Test
    void prefixesANameThatWouldStartWithADigit() {
        String code = codeOf(circuitCalling("id-1", "2adder.qasm"));

        assertTrue(code.contains("gate sub_2adder "), "an identifier cannot start with a digit: " + code);
    }

    @Test
    void keepsNamesUniqueWhenTwoFilesShareOne() {
        // Same file name in different directories: one gate would otherwise be declared twice, and
        // the generated code would not parse.
        String code = codeOf(circuitCalling("id-1", "bell.qasm", "id-2", "bell.qasm"));

        assertTrue(code.contains("gate bell "), code);
        assertTrue(code.contains("gate bell_2 "), "the second one gets a suffix: " + code);
    }

    @Test
    void fallsBackToTheIdWhenNoNameIsKnown() {
        QuantumRegister register = new QuantumRegister("q", 4);
        SubcircuitOperation withoutName = new SubcircuitOperation(
            false,
            new ArrayList<>(List.of(new ElementSelector(register.getId(), 0))),
            new ArrayList<>(),
            "abc-123"
        );
        QuantumCircuit circuit = QuantumCircuit.builder()
            .id("c")
            .projectId("p")
            .fileId("f")
            .registers(List.of(register))
            .layers(List.of(new Layer(new ArrayList<>(List.of(withoutName)))))
            .loopBlocks(List.of())
            .build();

        assertEquals(true, codeOf(circuit).contains("gate comp_abc_123 "), codeOf(circuit));
    }
}
