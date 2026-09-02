// Works out what the cursor is pointing at from the text alone.
// Whether a name actually refers to a declared register is decided by `ClassificationCache`.

export type WordRole = 'gate' | 'register' | 'keyword';

/** What can be inserted at an offset, which is not the same as what is written there. */
export type CompletionContext = { kind: 'gate' } | { kind: 'index'; register: string };

export interface QasmWord {
    text: string;
    role: WordRole;
    /** Offsets into the full text, not into `text`. */
    start: number;
    end: number;
}

// Keywords that are followed by a name being declared.
const DECLARATION_KEYWORDS = new Set([
    'qubit',
    'bit',
    'qreg',
    'creg',
    'int',
    'uint',
    'float',
    'angle',
    'bool',
    'complex',
    'duration',
    'stretch',
    'array',
    'const',
    'input',
    'output',
    'let',
    'gate',
    'def',
]);

// Gate modifiers. They come before the gate name.
const MODIFIERS = new Set(['ctrl', 'negctrl', 'inv', 'pow']);

// Everything else: keywords that neither declare a name nor call a gate.
const KEYWORDS = new Set([
    'OPENQASM',
    'include',
    'defcalgrammar',
    'measure',
    'reset',
    'barrier',
    'delay',
    'box',
    'if',
    'else',
    'for',
    'while',
    'in',
    'return',
    'end',
    'break',
    'continue',
    'switch',
    'case',
    'default',
    'pragma',
    'extern',
    'defcal',
    'cal',
    'pi',
    'tau',
    'euler',
]);

const IDENTIFIER_START = /[A-Za-z_$]/;
const IDENTIFIER_PART = /[A-Za-z0-9_$]/;
const STATEMENT_END = /[;{}]/;

/** Returns null unless the offset sits on an identifier outside comments and strings. */
export function wordAt(text: string, offset: number): QasmWord | null {
    const position = Math.max(0, Math.min(offset, text.length));
    const start = wordStart(text, position);
    const end = identifierEnd(text, position);

    if (start === end) return null;

    const word = text.slice(start, end);
    // Numbers match IDENTIFIER_PART as well, but they are not names.
    if (!IDENTIFIER_START.test(word[0])) return null;

    const context = contextAt(text, start);
    if (!context.inCode) return null;

    return { text: word, role: roleOf(word, context.before), start, end };
}

function roleOf(word: string, before: readonly string[]): WordRole {
    if (MODIFIERS.has(word) || KEYWORDS.has(word) || DECLARATION_KEYWORDS.has(word)) return 'keyword';

    // The first name in a statement is the gate being called, ignoring modifiers.
    // Everything after it is an argument, so a register.
    return namesSoFar(before).length === 0 ? 'gate' : 'register';
}

/** Returns null where there is nothing useful to suggest. */
export function completionAt(text: string, offset: number): CompletionContext | null {
    // Classify from the start of the half typed word, not from the cursor.
    const context = contextAt(text, wordStart(text, offset));
    if (!context.inCode) return null;

    if (context.indexing) {
        return DECLARATION_KEYWORDS.has(context.indexing) ? null : { kind: 'index', register: context.indexing };
    }

    return namesSoFar(context.before).length === 0 ? { kind: 'gate' } : null;
}

const namesSoFar = (before: readonly string[]): readonly string[] =>
    before.filter((identifier) => !MODIFIERS.has(identifier));

function wordStart(text: string, offset: number): number {
    let start = Math.max(0, Math.min(offset, text.length));
    while (start > 0 && IDENTIFIER_PART.test(text[start - 1])) start -= 1;

    return start;
}

interface Context {
    /** False inside a comment or a string. */
    inCode: boolean;
    /** Identifiers of the current statement, up to the offset. */
    before: string[];
    /** Set when the offset is inside `[...]`, to the register being indexed. */
    indexing?: string;
}

/** Scans from the start of the text, since a statement can span several lines. */
function contextAt(text: string, offset: number): Context {
    let before: string[] = [];
    // Open `[` brackets, innermost last.
    let indexing: string[] = [];
    let index = 0;

    while (index < offset) {
        const skipped = skipNonCode(text, index);

        if (skipped !== null) {
            if (skipped > offset) return { inCode: false, before };
            index = skipped;
        } else if (STATEMENT_END.test(text[index])) {
            // Also drops any `[` left open by broken code, which would otherwise
            // make the rest of the file look like one long index.
            before = [];
            indexing = [];
            index += 1;
        } else if (text[index] === '[') {
            indexing.push(before.at(-1) ?? '');
            index += 1;
        } else if (text[index] === ']') {
            indexing.pop();
            index += 1;
        } else if (IDENTIFIER_START.test(text[index])) {
            const end = identifierEnd(text, index);
            before.push(text.slice(index, end));
            index = end;
        } else {
            index += 1;
        }
    }

    return { inCode: true, before, indexing: indexing.at(-1) };
}

/** Index after the comment or string starting here, or null if none starts here. */
function skipNonCode(text: string, index: number): number | null {
    if (text.startsWith('//', index)) return endOf(text, '\n', index, 1);
    if (text.startsWith('/*', index)) return endOf(text, '*/', index + 2, 2);
    if (text[index] === '"' || text[index] === "'") return stringEnd(text, index);

    return null;
}

function endOf(text: string, terminator: string, from: number, length: number): number {
    const found = text.indexOf(terminator, from);

    // One past the end, so that an unterminated comment covers every offset,
    // including one at the very end of the text.
    return found === -1 ? text.length + 1 : found + length;
}

/**
 * Strings cannot span lines (`'"' ~["\r\t\n]+? '"'`), so a quote without a partner on
 * its own line opens nothing and we only step over the quote character itself.
 */
function stringEnd(text: string, index: number): number {
    const closing = text.indexOf(text[index], index + 1);
    const lineEnd = text.indexOf('\n', index + 1);
    if (closing === -1 || (lineEnd !== -1 && lineEnd < closing)) return index + 1;

    return closing + 1;
}

function identifierEnd(text: string, index: number): number {
    let end = index;
    while (end < text.length && IDENTIFIER_PART.test(text[end])) end += 1;

    return end;
}
