package edu.kit.quak.core.circuit.codegen;

import edu.kit.quak.application.circuit.antlr.QasmService;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import org.junit.jupiter.api.Test;

public class QrispCodeGenratorTest {

    @Test
    void basic() {
        String qasmCode = """
            qubit[3] q;

            h q[0];
            x q[1];
            y q[2];

            z q[0];
            s q[1];
            t q[2];

            rx q[0];
            ry q[1];
            rz q[2];
            """;
        QasmService qasmService = new QasmService();
        QuantumCircuit circuit = qasmService.parse(qasmCode);
        String generatedCode = QrispCodeGenerator.toCode(circuit);

        System.out.println(generatedCode);
    }
}
