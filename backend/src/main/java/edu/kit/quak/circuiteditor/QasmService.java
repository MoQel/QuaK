package edu.kit.quak.circuiteditor;

import edu.kit.quak.circuiteditor.elements.QuantumCircuit;
import edu.kit.quak.parser.qasm.OpenQASM3Lexer;
import edu.kit.quak.parser.qasm.OpenQASM3Parser;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.ParseTree;
import org.springframework.stereotype.Service;

@Service
public class QasmService {

    public QuantumCircuit parse(String qasmCode) {
        CharStream input = CharStreams.fromString(qasmCode);
        OpenQASM3Lexer lexer = new OpenQASM3Lexer(input);
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        OpenQASM3Parser parser = new OpenQASM3Parser(tokens);

        ParseTree tree = parser.program();

        QasmCircuitVisitor visitor = new QasmCircuitVisitor();
        visitor.visit(tree);

        return visitor.getCircuit();
    }
}
