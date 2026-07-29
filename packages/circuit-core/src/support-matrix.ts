// OpenQASM 3 support matrix: which constructs the circuit editor can round-trip
// losslessly. Documents using an unsupported construct are shown read-only, so
// nothing is silently dropped (D2).
//
// This is the single source D8 asks for: the strict visitor decides what to
// reject by reading it, the tests assert it agrees with the gate table, and the
// README is generated from it. Adding a construct means editing this file, not
// a list buried in the transform.

import { GATE_ARITY, type OperationIdentifier } from './gate-types.ts';

export type SupportStatus = 'supported' | 'unsupported';

export type ConstructKind =
    /** A rule name from OpenQASM3Parser.g4, matched against the parse tree. */
    | 'statement'
    /** A gate identifier, matched against the name in a gate call. */
    | 'gate'
    /** Neither — something about the document the parser sees outside the tree. */
    | 'lexical';

export interface SupportMatrixEntry {
    construct: string;
    kind: ConstructKind;
    status: SupportStatus;
    /** Not yet proven by a round-trip fixture. */
    provisional?: boolean;
    /** Shown to the user when this is why the document is read-only. */
    note?: string;
}

// Gates the editor renders. Their shapes live in GATE_ARITY; this only records
// whether the round trip is believed to work. MEASURE and DUMMY are deliberately
// absent: `measure` is not a gate call in the grammar, and DUMMY is a drag-time
// placeholder that never exists in a document.
const SUPPORTED_GATES: readonly OperationIdentifier[] = [
    'H',
    'X',
    'Y',
    'Z',
    'CX',
    'CCX',
    'CZ',
    'SWAP',
    'S',
    'T',
    'RX',
    'RY',
    'RZ',
];

// Statement rules the circuit model has no representation for. The note is shown
// to the user, so it names the concept rather than the grammar rule.
const UNSUPPORTED_STATEMENT_RULES: Readonly<Record<string, string>> = {
    aliasDeclarationStatement: 'aliases',
    assignmentStatement: 'classical assignment',
    barrierStatement: 'barrier',
    boxStatement: 'box',
    breakStatement: 'control flow',
    calStatement: 'calibration',
    calibrationGrammarStatement: 'calibration',
    classicalDeclarationStatement: 'classical declarations',
    constDeclarationStatement: 'constant declarations',
    continueStatement: 'control flow',
    defStatement: 'subroutine definitions',
    defcalStatement: 'calibration',
    delayStatement: 'timing',
    endStatement: 'end',
    expressionStatement: 'bare expressions',
    externStatement: 'extern',
    forStatement: 'control flow',
    gateStatement: 'gate definitions',
    ifStatement: 'control flow',
    ioDeclarationStatement: 'io declarations',
    measureArrowAssignmentStatement: 'measurement',
    oldStyleDeclarationStatement: 'OpenQASM 2 style declarations',
    pragma: 'pragma',
    resetStatement: 'reset',
    returnStatement: 'control flow',
    switchStatement: 'control flow',
    whileStatement: 'control flow',
};

export const SUPPORT_MATRIX: readonly SupportMatrixEntry[] = [
    // Statements the transform reads.
    { construct: 'version', kind: 'statement', status: 'supported', provisional: true },
    { construct: 'includeStatement', kind: 'statement', status: 'supported', provisional: true },
    { construct: 'quantumDeclarationStatement', kind: 'statement', status: 'supported', provisional: true },
    { construct: 'gateCallStatement', kind: 'statement', status: 'supported', provisional: true },

    ...SUPPORTED_GATES.map(
        (construct): SupportMatrixEntry => ({ construct, kind: 'gate', status: 'supported', provisional: true }),
    ),

    ...Object.entries(UNSUPPORTED_STATEMENT_RULES).map(
        ([construct, note]): SupportMatrixEntry => ({ construct, kind: 'statement', status: 'unsupported', note }),
    ),

    {
        construct: 'comment',
        kind: 'lexical',
        status: 'unsupported',
        note: 'comments are content; regenerating the file would drop them',
    },
];

/** Grammar rule -> human reason, for the strict visitor's rejection messages. */
export const unsupportedStatementRules = (): Readonly<Record<string, string>> => UNSUPPORTED_STATEMENT_RULES;

export const isConstructSupported = (construct: string): boolean =>
    SUPPORT_MATRIX.some((entry) => entry.construct === construct && entry.status === 'supported');

export const isGateSupported = (identifier: string): boolean =>
    SUPPORT_MATRIX.some(
        (entry) => entry.kind === 'gate' && entry.construct === identifier && entry.status === 'supported',
    );

/** Every gate the matrix claims support for must have a shape the editor can draw. */
export const supportedGates = (): readonly OperationIdentifier[] =>
    SUPPORTED_GATES.filter((gate) => gate in GATE_ARITY);
