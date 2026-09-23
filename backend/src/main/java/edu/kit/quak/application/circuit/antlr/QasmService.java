package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import edu.kit.quak.application.circuit.ports.out.QasmIncludeLoader;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.tree.ParseTree;
import org.springframework.stereotype.Service;

@Service
public class QasmService {

    /** Parses standalone code; any {@code include} of a non-standard library fails for lack of file context. */
    public QuantumCircuit parse(String qasmCode) {
        return parse(qasmCode, null, QasmIncludeLoader.NONE);
    }

    /**
     * Parses code that belongs to a stored file, so {@code include "..."} statements can be resolved
     * against the project's other files.
     *
     * @param qasmCode   the source to parse
     * @param rootFileId id of the file the source belongs to, the base for its includes; may be null
     * @param includeLoader loads included files on behalf of the requesting user
     */
    public QuantumCircuit parse(String qasmCode, String rootFileId, QasmIncludeLoader includeLoader) {
        try {
            ParseTree tree = toParseTree(qasmCode);

            QasmCircuitVisitor visitor = new QasmCircuitVisitor(rootFileId, includeLoader);
            visitor.visit(tree);

            return visitor.getCircuit();
        } catch (QasmParseException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            // Shield any unexpected parsing/translation failure as a clean client error (400) instead of a 500.
            throw new QasmParseException("Could not parse OpenQASM code: " + ex.getMessage(), ex);
        }
    }

    /**
     * Builds a parse tree from OpenQASM source. Shared with {@link QasmCircuitVisitor}, which needs
     * it to parse the files pulled in by {@code include} statements.
     */
    static ParseTree toParseTree(String qasmCode) {
        CharStream input = CharStreams.fromString(qasmCode);

        OpenQASM3Lexer lexer = new OpenQASM3Lexer(input);
        lexer.removeErrorListeners();
        lexer.addErrorListener(ThrowingErrorListener.INSTANCE);

        CommonTokenStream tokens = new CommonTokenStream(lexer);

        OpenQASM3Parser parser = new OpenQASM3Parser(tokens);
        parser.removeErrorListeners();
        parser.addErrorListener(ThrowingErrorListener.INSTANCE);

        return parser.program();
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
