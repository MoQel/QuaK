package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.ParseTree;
import org.springframework.stereotype.Service;

@Service
public class QasmService {

    public QuantumCircuit parse(String qasmCode) {
        try {
            CharStream input = CharStreams.fromString(qasmCode);

            OpenQASM3Lexer lexer = new OpenQASM3Lexer(input);
            lexer.removeErrorListeners();
            lexer.addErrorListener(ThrowingErrorListener.INSTANCE);

            CommonTokenStream tokens = new CommonTokenStream(lexer);

            OpenQASM3Parser parser = new OpenQASM3Parser(tokens);
            parser.removeErrorListeners();
            parser.addErrorListener(ThrowingErrorListener.INSTANCE);

            ParseTree tree = parser.program();

            QasmCircuitVisitor visitor = new QasmCircuitVisitor();
            visitor.visit(tree);

            return visitor.getCircuit();
        } catch (QasmParseException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            // Shield any unexpected parsing/translation failure as a clean client error (400) instead of a 500.
            throw new QasmParseException("Could not parse OpenQASM code: " + ex.getMessage(), ex);
        }
    }

    /** ANTLR error listener that turns syntax errors into a {@link QasmParseException} instead of just logging. */
    private static final class ThrowingErrorListener extends BaseErrorListener {

        private static final ThrowingErrorListener INSTANCE = new ThrowingErrorListener();

        @Override
        public void syntaxError(
            Recognizer<?, ?> recognizer,
            Object offendingSymbol,
            int line,
            int charPositionInLine,
            String msg,
            RecognitionException e
        ) {
            throw new QasmParseException("Syntax error at line %d:%d - %s".formatted(line, charPositionInLine, msg));
        }
    }
}
