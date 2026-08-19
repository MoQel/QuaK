// What the cursor points at, from the text alone. The other half — which registers
// exist — comes from `ClassificationCache`.

export type WordRole = 'gate' | 'register' | 'keyword';

export interface QasmWord {
    text: string;
    role: WordRole;
    /** Offsets into the text this word was found in. */
    start: number;
    end: number;
}

/** Keywords a declared name follows. */
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

/** Modifiers stand before the gate they modify. */
const MODIFIERS = new Set(['ctrl', 'negctrl', 'inv', 'pow']);

/** Keywords that neither declare nor call anything. */
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

/** Null unless the offset sits on an identifier in code. */
export function wordAt(text: string, offset: number): QasmWord | null {
    const position = Math.max(0, Math.min(offset, text.length));

    let start = position;
    while (start > 0 && IDENTIFIER_PART.test(text[start - 1])) start -= 1;
    const end = identifierEnd(text, position);

    if (start === end) return null;

    const word = text.slice(start, end);
    // A number literal shares the character class and names nothing.
    if (!IDENTIFIER_START.test(word[0])) return null;

    const context = contextAt(text, start);
    if (!context.inCode) return null;

    return { text: word, role: roleOf(word, context.before), start, end };
}

function roleOf(word: string, before: readonly string[]): WordRole {
    if (MODIFIERS.has(word) || KEYWORDS.has(word) || DECLARATION_KEYWORDS.has(word)) return 'keyword';

    // Only a modifier may stand before a gate call; past the first identifier every
    // statement names a register.
    const named = before.filter((identifier) => !MODIFIERS.has(identifier));

    return named.length === 0 ? 'gate' : 'register';
}

interface Context {
    /** False inside a comment or a string. */
    inCode: boolean;
    /** Identifiers of the current statement, before the offset. */
    before: string[];
}

/** Walks the text once up to `offset`; a gate call may span lines, so the line alone will not do. */
function contextAt(text: string, offset: number): Context {
    let before: string[] = [];
    let index = 0;

    while (index < offset) {
        const skipped = skipNonCode(text, index);

        if (skipped !== null) {
            if (skipped > offset) return { inCode: false, before };
            index = skipped;
        } else if (STATEMENT_END.test(text[index])) {
            before = [];
            index += 1;
        } else if (IDENTIFIER_START.test(text[index])) {
            const end = identifierEnd(text, index);
            before.push(text.slice(index, end));
            index = end;
        } else {
            index += 1;
        }
    }

    return { inCode: true, before };
}

/** Index after the comment or string starting here, or null if none starts here. */
function skipNonCode(text: string, index: number): number | null {
    if (text.startsWith('//', index)) return endOf(text, '\n', index, 1);
    if (text.startsWith('/*', index)) return endOf(text, '*/', index + 2, 2);
    if (text[index] === '"' || text[index] === "'") return stringEnd(text, index);

    return null;
}

/** An unterminated comment runs to the end of the text. */
function endOf(text: string, terminator: string, from: number, length: number): number {
    const found = text.indexOf(terminator, from);

    return found === -1 ? text.length : found + length;
}

/**
 * Strings do not span lines (`'"' ~["\r\t\n]+? '"'`), so a quote with no partner on its
 * line opens nothing and only the character itself is stepped over.
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
