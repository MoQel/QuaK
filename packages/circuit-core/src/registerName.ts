/**
 * Whether a register name can be written into an OpenQASM document.
 *
 * A register name reaches generated code verbatim, in `qubit[2] q;` and in every
 * operand that follows. A name that is not an identifier therefore does not
 * produce a worse-looking file, it produces one that no longer parses, and the
 * extension would hand the user back a document it can no longer read.
 *
 * Mirrors the `Identifier` rule and the keyword list of
 * `backend/src/main/antlr/OpenQASM3Lexer.g4`.
 */

const FIRST_CHARACTER = String.raw`_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}`;
const IDENTIFIER = new RegExp(`^[${FIRST_CHARACTER}][${FIRST_CHARACTER}0-9]*$`, 'u');

const RESERVED_KEYWORDS = new Set([
    'OPENQASM',
    'angle',
    'array',
    'barrier',
    'bit',
    'bool',
    'box',
    'break',
    'cal',
    'case',
    'complex',
    'const',
    'continue',
    'creg',
    'ctrl',
    'def',
    'default',
    'defcal',
    'defcalgrammar',
    'delay',
    'duration',
    'durationof',
    'else',
    'end',
    'extern',
    'float',
    'for',
    'gate',
    'gphase',
    'if',
    'im',
    'in',
    'include',
    'input',
    'int',
    'inv',
    'let',
    'measure',
    'mutable',
    'negctrl',
    'nop',
    'output',
    'pow',
    'qreg',
    'qubit',
    'readonly',
    'reset',
    'return',
    'stretch',
    'switch',
    'uint',
    'void',
    'while',
]);

export type RegisterNameProblem = 'empty' | 'not-an-identifier' | 'reserved-keyword';

/** The reason a register name cannot be used, or null when it can. */
export function checkRegisterName(name: string): RegisterNameProblem | null {
    const trimmed = name.trim();

    if (!trimmed) return 'empty';
    if (!IDENTIFIER.test(trimmed)) return 'not-an-identifier';
    if (RESERVED_KEYWORDS.has(trimmed)) return 'reserved-keyword';

    return null;
}

/** What to show the user for a given problem. */
export function describeRegisterNameProblem(problem: RegisterNameProblem): string {
    switch (problem) {
        case 'empty':
            return 'Give the register a name.';
        case 'not-an-identifier':
            return 'Use letters, digits and underscores, starting with a letter or underscore.';
        case 'reserved-keyword':
            return 'This is an OpenQASM keyword. Pick another name.';
    }
}
