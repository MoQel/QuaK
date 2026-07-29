import {
    BaseErrorListener,
    CharStream,
    CommonTokenStream,
    type ATNSimulator,
    type RecognitionException,
    type Recognizer,
    type Token,
} from 'antlr4ng';
import { OpenQASM3Lexer } from './generated/OpenQASM3Lexer.js';
import { OpenQASM3Parser, type ProgramContext } from './generated/OpenQASM3Parser.js';

export interface QasmSyntaxError {
    line: number;
    column: number;
    message: string;
}

/**
 * ANTLR's default listener prints to stderr and carries on. A `.qasm` the user
 * is editing is malformed most of the time, so the errors are data we act on
 * (the editor goes read-only), not console noise.
 */
class CollectingErrorListener extends BaseErrorListener {
    readonly errors: QasmSyntaxError[] = [];

    override syntaxError<S extends Token, T extends ATNSimulator>(
        _recognizer: Recognizer<T>,
        _offendingSymbol: S | null,
        line: number,
        column: number,
        message: string,
        _e: RecognitionException | null,
    ): void {
        this.errors.push({ line, column, message });
    }
}

export interface ParseResult {
    tree: ProgramContext;
    errors: QasmSyntaxError[];
}

/**
 * Parses OpenQASM 3 source into a parse tree, collecting syntax errors instead
 * of throwing: a tree is still produced for partially valid input, which is what
 * lets the editor show something while the user is mid-keystroke.
 *
 * This is only the grammar layer. Turning the tree into a circuit — and deciding
 * which constructs are supported at all — is the visitor's job.
 */
export function parseQasm(source: string): ParseResult {
    const listener = new CollectingErrorListener();

    const lexer = new OpenQASM3Lexer(CharStream.fromString(source));
    lexer.removeErrorListeners();
    lexer.addErrorListener(listener);

    const parser = new OpenQASM3Parser(new CommonTokenStream(lexer));
    parser.removeErrorListeners();
    parser.addErrorListener(listener);

    return { tree: parser.program(), errors: listener.errors };
}
