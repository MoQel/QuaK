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

const UNFINISHED = 'The file ends in the middle of a statement.';

/** `missing ';' at 'h'` — the expected part can be a set, so it is kept verbatim. */
const MISSING_TOKEN = /^missing (.+?) at /;

/**
 * ANTLR's default listener prints to stderr; syntax errors belong in the document
 * state instead. It also moves errors ANTLR blames on the wrong token: what is
 * missing is reported at the token *after* the gap, which the hidden channel can
 * put several lines away.
 */
class CollectingErrorListener extends BaseErrorListener {
    readonly errors: QasmSyntaxError[] = [];

    constructor(
        private readonly lines: readonly string[],
        private readonly tokens: CommonTokenStream,
    ) {
        super();
    }

    override syntaxError<S extends Token, T extends ATNSimulator>(
        _recognizer: Recognizer<T>,
        offendingSymbol: S | null,
        line: number,
        column: number,
        message: string,
        _e: RecognitionException | null,
    ): void {
        const error = this.relocate(offendingSymbol, message) ?? { line, column, message };

        // A half-written statement can fail several rules at the same spot.
        if (!this.errors.some((seen) => sameSpot(seen, error))) {
            this.errors.push(error);
        }
    }

    /** Null where ANTLR's own position is the honest one, which it usually is. */
    private relocate<S extends Token>(offendingSymbol: S | null, message: string): QasmSyntaxError | null {
        if (!offendingSymbol) return null;

        // EOF sits behind the final newline, on a line the reader cannot see.
        if (offendingSymbol.type === Token.EOF) return this.endOfContent();

        const expected = MISSING_TOKEN.exec(message)?.[1];
        const previous = expected ? this.previousVisibleToken(offendingSymbol) : null;
        if (!expected || !previous) return null;

        return {
            line: previous.line,
            column: previous.column + (previous.text?.length ?? 0),
            message: `Missing ${expected} after '${previous.text ?? ''}'.`,
        };
    }

    /** The last token the user actually typed; comments and whitespace are hidden. */
    private previousVisibleToken(offendingSymbol: Token): Token | null {
        for (let index = offendingSymbol.tokenIndex - 1; index >= 0; index--) {
            const token = this.tokens.get(index);
            if (token.channel === Token.DEFAULT_CHANNEL) return token;
        }

        return null;
    }

    private endOfContent(): QasmSyntaxError {
        const index = lastIndexOfContent(this.lines);

        return { line: index + 1, column: this.lines[index]?.length ?? 0, message: UNFINISHED };
    }
}

const sameSpot = (a: QasmSyntaxError, b: QasmSyntaxError): boolean =>
    a.line === b.line && a.column === b.column && a.message === b.message;

/** Index of the last line carrying something other than whitespace. */
function lastIndexOfContent(lines: readonly string[]): number {
    for (let index = lines.length - 1; index >= 0; index--) {
        if (lines[index].trim().length > 0) return index;
    }

    return 0;
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
    const lexer = new OpenQASM3Lexer(CharStream.fromString(source));
    const tokens = new CommonTokenStream(lexer);

    // Tokens are pulled lazily, so the stream is filled far enough whenever an error fires.
    const listener = new CollectingErrorListener(source.split('\n'), tokens);
    lexer.removeErrorListeners();
    lexer.addErrorListener(listener);

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
