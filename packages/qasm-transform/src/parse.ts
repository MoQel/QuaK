import {
    BaseErrorListener,
    CharStream,
    CommonTokenStream,
    Token,
    type ATNSimulator,
    type RecognitionException,
    type Recognizer,
} from 'antlr4ng';
import { OpenQASM3Lexer } from './generated/OpenQASM3Lexer.js';
import { OpenQASM3Parser, type ProgramContext } from './generated/OpenQASM3Parser.js';

export interface QasmSyntaxError {
    line: number;
    column: number;
    message: string;
}

/**
 * ANTLR's default listener prints to stderr. Syntax errors are part of the
 * document state, so the extension collects them instead.
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

export interface QasmComment {
    line: number;
    column: number;
    text: string;
}

export interface ParseResult {
    tree: ProgramContext;
    errors: QasmSyntaxError[];
    /** Comments are hidden-channel tokens, not parse-tree nodes. */
    comments: QasmComment[];
}

/**
 * Parses OpenQASM 3 source and collects syntax errors without throwing.
 * Turning the tree into a supported circuit is handled by `toCircuit`.
 */
export function parseQasm(source: string): ParseResult {
    const listener = new CollectingErrorListener();

    const lexer = new OpenQASM3Lexer(CharStream.fromString(source));
    lexer.removeErrorListeners();
    lexer.addErrorListener(listener);

    const tokens = new CommonTokenStream(lexer);
    const parser = new OpenQASM3Parser(tokens);
    parser.removeErrorListeners();
    parser.addErrorListener(listener);

    const tree = parser.program();

    // The token stream is filled after parsing, including hidden-channel comments.
    const comments = tokens
        .getTokens()
        .filter((token) => token.channel === Token.HIDDEN_CHANNEL)
        .map((token) => ({ line: token.line, column: token.column, text: token.text ?? '' }));

    return { tree, errors: listener.errors, comments };
}
