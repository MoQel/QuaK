import { GATE_ARITY, type OperationIdentifier } from './gate-types.ts';

export type SupportStatus = 'supported' | 'unsupported';

export type ConstructKind =
    /** Rule name from OpenQASM3Parser.g4. */
    | 'statement'
    /** Gate identifier from a gate call. */
    | 'gate'
    /** Source content outside normal statement support, such as comments. */
    | 'lexical';

/** OpenQASM construct support for lossless visual editing. */
export interface SupportMatrixEntry {
    construct: string;
    kind: ConstructKind;
    status: SupportStatus;
    /** Supported by implementation but not yet backed by a dedicated fixture. */
    provisional?: boolean;
    /** Human-readable reason shown when this construct makes a document read-only. */
    note?: string;
}

// Gate shapes live in GATE_ARITY. This list only records which gate calls round-trip through QASM.
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

/**
 * Every gate `stdgates.inc` defines, plus the two language builtins.
 *
 * Not a list of what we support; that is SUPPORTED_GATES. This one separates "a real
 * gate this editor cannot draw" from "a name that exists nowhere", which are different
 * things to tell a user. It is sound because gate definitions of their own make a
 * document unsupported anyway, so in a file we would otherwise accept, every gate call
 * has to resolve to one of these.
 */
const STANDARD_GATE_NAMES: ReadonlySet<string> = new Set([
    // stdgates.inc
    'p',
    'x',
    'y',
    'z',
    'h',
    's',
    'sdg',
    't',
    'tdg',
    'sx',
    'rx',
    'ry',
    'rz',
    'cx',
    'cy',
    'cz',
    'cp',
    'crx',
    'cry',
    'crz',
    'ch',
    'swap',
    'ccx',
    'cswap',
    'cu',
    // OpenQASM 2 compatibility, also declared by stdgates.inc
    'CX',
    'phase',
    'cphase',
    'id',
    'u1',
    'u2',
    'u3',
    // Language builtins, available without an include
    'U',
    'gphase',
]);

/** Whether OpenQASM defines this gate at all. */
export const isStandardGate = (name: string): boolean => STANDARD_GATE_NAMES.has(name);

// Statement rules the circuit model cannot represent. Values are user-facing reasons.
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

/** Constructs the visual editor can and cannot preserve when rewriting OpenQASM. */
export const SUPPORT_MATRIX: readonly SupportMatrixEntry[] = [
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

/** Grammar rule to user-facing rejection reason. */
export const unsupportedStatementRules = (): Readonly<Record<string, string>> => UNSUPPORTED_STATEMENT_RULES;

export const isGateSupported = (identifier: string): boolean =>
    SUPPORT_MATRIX.some(
        (entry) => entry.kind === 'gate' && entry.construct === identifier && entry.status === 'supported',
    );

/** Supported gate calls that also have editor arity metadata. */
export const supportedGates = (): readonly OperationIdentifier[] =>
    SUPPORTED_GATES.filter((gate) => gate in GATE_ARITY);
