import {
    GATE_ARITY,
    isGateSupported,
    isStandardGate,
    toOperationIdentifier,
    unsupportedStatementRules,
    type CircuitContent,
    type ElementSelectorDto,
    type LayerResponse,
    type QuantumOperationDto,
    type QuantumRegisterResponse,
    OperationIdentifier,
} from '@quak/circuit-core';
import { evaluateAngle, QasmUnsupportedError } from './angleExpression.ts';
import { layerMarker, registerMarker } from './structuralComments.ts';
import { parseQasm, type QasmComment, type QasmSyntaxError } from './parse.ts';
import {
    GateCallStatementContext,
    GateOperandContext,
    QuantumDeclarationStatementContext,
    StatementContext,
    type ProgramContext,
    GateOperandListContext,
} from './generated/OpenQASM3Parser.js';

/**
 * Why the transform refused something. Two different things to tell a user.
 *
 * `invalid` means the document is wrong and no OpenQASM tool would accept it.
 * `unsupported` means the document is fine and this editor cannot write it back.
 * Reporting the first as the second is what made a typo read as a missing feature.
 */
export type RejectionKind = 'invalid' | 'unsupported';

export interface QasmRejection {
    line: number;
    column: number;
    /** Grammar rule or gate name, for the support matrix. */
    construct: string;
    message: string;
    kind: RejectionKind;
}

/**
 * The parts of the document that frame the circuit without being part of it.
 *
 * The extension rewrites the full file after a visual edit. Version, includes
 * and top-of-file comments are preserved here so they are not dropped.
 */
export interface QasmPreamble {
    /** e.g. "3.0" from `OPENQASM 3.0;`. */
    version: string | null;
    /** Include targets verbatim, in source order, e.g. `"stdgates.inc"`. */
    includes: string[];
    /**
     * Comments before the first statement. Later comments are tied to statements
     * the visual editor may move or delete, so they are reported as unsupported.
     */
    headerComments: string[];
}

export interface ToCircuitResult {
    /** Null when the document cannot be represented as a circuit at all. */
    content: CircuitContent | null;
    preamble: QasmPreamble;
    syntaxErrors: QasmSyntaxError[];
    unsupported: QasmRejection[];
}

/** Why a document is, or is not, editable through the circuit view. */
export type DocumentClassification =
    | { kind: 'editable' }
    | { kind: 'invalid'; problems: QasmRejection[] }
    | { kind: 'unsupportedVersion'; version: string }
    | { kind: 'unsupported'; constructs: QasmRejection[] }
    | { kind: 'commentsOnly'; comments: QasmRejection[] }
    | { kind: 'empty' }
    /** Nothing to draw yet; the notice names the lines that are still missing. */
    | { kind: 'noRegister'; hasVersion: boolean; hasInclude: boolean };

const SUPPORTED_MAJOR_VERSION = '3';

/** `OPENQASM 3;` and `OPENQASM 3.0;` declare the same major version. */
const majorVersion = (version: string): string => version.split('.')[0];

/** Comments are the one rejection a user can knowingly accept, so they stand apart. */
const isComment = (entry: QasmRejection): boolean => entry.construct === 'comment';

/** A syntax error is a rejection too; carrying one shape keeps the notice and the diagnostics simple. */
const asRejection = (error: QasmSyntaxError): QasmRejection => ({ ...error, construct: 'syntax', kind: 'invalid' });

/**
 * Names the single most useful reason a document cannot be edited visually.
 *
 * The order of the checks is the design: whatever matches first is the cause, and
 * most of what follows is a consequence of it.
 */
export function classify(result: ToCircuitResult): DocumentClassification {
    if (result.syntaxErrors.length > 0) {
        // On their own: the visitor walks past a broken parse tree and rejects fragments
        // that were never real statements, which next to the actual error is noise.
        return { kind: 'invalid', problems: result.syntaxErrors.map(asRejection) };
    }

    const { version, includes, headerComments } = result.preamble;
    if (version !== null && majorVersion(version) !== SUPPORTED_MAJOR_VERSION) {
        return { kind: 'unsupportedVersion', version };
    }

    // Ahead of the register checks: `qreg q[2];` does declare one, just not readably.
    // Also ahead of the errors below, because a statement we walked past is exactly what
    // makes a later reference to it look undefined.
    const constructs = result.unsupported.filter((entry) => entry.kind === 'unsupported' && !isComment(entry));
    if (constructs.length > 0) {
        return { kind: 'unsupported', constructs };
    }

    const problems = result.unsupported.filter((entry) => entry.kind === 'invalid');
    if (problems.length > 0) {
        return { kind: 'invalid', problems };
    }

    if (result.content === null) {
        const nothingWritten = version === null && includes.length === 0 && headerComments.length === 0;
        if (nothingWritten) return { kind: 'empty' };

        return { kind: 'noRegister', hasVersion: version !== null, hasInclude: includes.length > 0 };
    }

    // Last, so the opt-in is only offered where accepting it actually unlocks editing.
    const comments = result.unsupported.filter(isComment);
    if (comments.length > 0) {
        return { kind: 'commentsOnly', comments };
    }

    return { kind: 'editable' };
}

/** Editable means the transform can regenerate the document; `classify` names the reasons it cannot. */
export const isEditable = (result: ToCircuitResult): boolean => classify(result).kind === 'editable';

const UNSUPPORTED_STATEMENTS = unsupportedStatementRules();

/**
 * The text of a token the tree may not really have: the generated accessors type every
 * child as present, but error recovery both drops them and invents them, the invented
 * ones reading `<missing Identifier>`.
 */
function tokenText(node: { symbol: { tokenIndex: number; text?: string | null } } | null | undefined): string | null {
    if (!node || node.symbol.tokenIndex < 0) return null;

    return node.symbol.text ?? null;
}

type SourcePosition = { start: { line: number; column: number } | null };

/** Enough of a parse-tree node to find the text it was built from. */
type SourceSpan = { start: { start: number } | null; stop: { stop: number } | null };

class CircuitBuilder {
    // Classical registers are rejected because CircuitContent carries only qubits.
    readonly registers: QuantumRegisterResponse[] = [];
    readonly layers: LayerResponse[] = [];
    readonly unsupported: QasmRejection[] = [];
    readonly includes: string[] = [];

    constructor(
        private readonly source: string,
        private readonly continuedLayers: ReadonlySet<number>,
    ) {}

    /** Opens a layer, unless this operation was written as part of the one before it. */
    place(operation: QuantumOperationDto, line: number): void {
        const open = this.layers.at(-1);
        if (open && this.continuedLayers.has(line)) open.quantumOperations.push(operation);
        else this.layers.push({ quantumOperations: [operation] });
    }

    /**
     * What the user wrote for a construct, cut from the source: `getText()` walks a
     * node's default channel, losing every space and picking up invented tokens.
     */
    excerpt(ctx: SourceSpan): string {
        const from = ctx.start?.start ?? -1;
        const to = ctx.stop?.stop ?? -1;
        if (from < 0 || to < from) return '';

        return truncate(this.source.slice(from, to + 1).replaceAll(/\s+/g, ' '));
    }

    registerByName(name: string): QuantumRegisterResponse | undefined {
        return this.registers.find((register) => register.name === name);
    }

    /** Valid OpenQASM this editor cannot write back. */
    reject(ctx: SourcePosition, construct: string, message: string): void {
        this.push(ctx, construct, message, 'unsupported');
    }

    /** OpenQASM that is wrong, whatever tool reads it. */
    invalid(ctx: SourcePosition, construct: string, message: string): void {
        this.push(ctx, construct, message, 'invalid');
    }

    private push(ctx: SourcePosition, construct: string, message: string, kind: RejectionKind): void {
        this.unsupported.push({
            line: ctx.start?.line ?? 0,
            column: ctx.start?.column ?? 0,
            construct,
            message,
            kind,
        });
    }
}

/**
 * Turns OpenQASM 3 source into the circuit's registers and layers.
 *
 * Mirrors the backend visitor for supported constructs, but is stricter: it
 * collects unsupported syntax so the extension can keep risky files read-only.
 *
 * Layers are read the way the document writes them, so a file QuaK wrote comes back
 * from a read and a write unchanged.
 *
 * Ids are derived from source positions so React keys stay stable across reparses.
 */
export function toCircuit(source: string): ToCircuitResult {
    const { tree, errors, comments } = parseQasm(source);
    const structural = readStructuralComments(tree, comments);
    const builder = new CircuitBuilder(source, structural.continuedLayers);

    const firstStatementLine = startOfFirstStatement(tree);
    const headerComments: string[] = [];

    for (const comment of comments) {
        if (structural.markerKeys.has(commentKey(comment.line, comment.text))) continue;

        if (comment.line < firstStatementLine) {
            headerComments.push(comment.text.trim());
            continue;
        }

        builder.reject(
            { start: { line: comment.line, column: comment.column } },
            'comment',
            'Comments below the header would be lost when the circuit is written back.',
        );
    }

    for (const statementOrScope of tree.statementOrScope()) {
        const statement = statementOrScope.statement();
        if (!statement) {
            builder.reject(statementOrScope, 'scope', 'Blocks are not supported.');
            continue;
        }
        visitStatement(statement, builder);
    }

    const content: CircuitContent = { registers: builder.registers, layers: builder.layers };
    return {
        content: builder.registers.length > 0 ? content : null,
        preamble: {
            version: tokenText(tree.version()?.VersionSpecifier()),
            includes: builder.includes,
            headerComments,
        },
        syntaxErrors: errors,
        unsupported: builder.unsupported,
    };
}

function visitStatement(statement: StatementContext, builder: CircuitBuilder): void {
    const declaration = statement.quantumDeclarationStatement();
    if (declaration) {
        visitQuantumDeclaration(declaration, builder);
        return;
    }

    const gateCall = statement.gateCallStatement();
    if (gateCall) {
        visitGateCall(gateCall, builder);
        return;
    }

    // Includes are file preamble, not circuit content.
    const include = statement.includeStatement();
    if (include) {
        const file = tokenText(include.StringLiteral());
        if (file === null) {
            builder.invalid(include, 'includeStatement', 'This include names no file.');
            return;
        }
        builder.includes.push(file);
        return;
    }

    // The generated StatementContext exposes every alternative as an accessor.
    const rule = Object.keys(UNSUPPORTED_STATEMENTS).find((name) => {
        const accessor = (statement as unknown as Record<string, unknown>)[name];
        return typeof accessor === 'function' && (accessor as () => unknown).call(statement) != null;
    });
    const reason = rule ? UNSUPPORTED_STATEMENTS[rule] : 'unrecognized statement';
    builder.reject(statement, rule ?? 'statement', `Unsupported ${reason}: ${builder.excerpt(statement)}`);
}

function visitQuantumDeclaration(ctx: QuantumDeclarationStatementContext, builder: CircuitBuilder): void {
    const name = tokenText(ctx.Identifier());
    if (name === null) {
        builder.invalid(ctx, 'quantumDeclarationStatement', 'This qubit register has no name.');
        return;
    }

    const designator = ctx.qubitType().designator();

    let size = 1; // `qubit q;` with no [n] is a single qubit.
    if (designator) {
        const parsed = constantInt(designator.expression().getText());
        if (parsed === null || parsed < 1) {
            builder.reject(
                ctx,
                'qubitType',
                `Register size must be a positive constant integer: ${builder.excerpt(ctx)}`,
            );
            return;
        }
        size = parsed;
    }

    // Duplicate declarations would make earlier gate indices ambiguous.
    if (builder.registerByName(name)) {
        builder.invalid(ctx, 'quantumDeclarationStatement', `Qubit register '${name}' is declared more than once.`);
        return;
    }

    builder.registers.push({
        id: `qreg:${name}`,
        name,
        type: 'Quantum_Register',
        numberOfQubits: size,
    });
}

function visitGateCall(ctx: GateCallStatementContext, builder: CircuitBuilder): void {
    const identifierNode = ctx.Identifier();
    const operandList = ctx.gateOperandList();
    if (!identifierNode || !operandList) {
        // gphase and other operand-less calls have no editor representation.
        builder.reject(ctx, 'gateCallStatement', `Unsupported gate call: ${builder.excerpt(ctx)}`);
        return;
    }

    if (!checkNoModifiersOrDesignator(ctx, builder)) return;

    const gateName = identifierNode.getText();
    const identifier = resolveSupportedGate(gateName, ctx, builder);
    if (!identifier) return;

    const operands = parseOperands(operandList, builder);
    if (!operands) return;

    const { controlSize, targetSize, type } = GATE_ARITY[identifier];
    const expected = controlSize + targetSize;
    if (operands.length !== expected) {
        const qubits = expected === 1 ? 'qubit' : 'qubits';
        builder.invalid(ctx, identifier, `Gate '${gateName}' takes ${expected} ${qubits}, not ${operands.length}.`);
        return;
    }

    // OpenQASM lists controls before targets.
    const controlQubits = operands.slice(0, controlSize);
    const targetQubits = operands.slice(controlSize);

    const rotationAngle = resolveRotationAngle(ctx, identifier, gateName, builder);
    if (rotationAngle === null) return;

    const operation = {
        id: `op:${ctx.start?.line ?? 0}:${ctx.start?.column ?? 0}`,
        type,
        identifier,
        inverseForm: false,
        targetQubits,
        controlQubits,
        rotationAngle,
    } as QuantumOperationDto;

    builder.place(operation, ctx.start?.line ?? 0);
}

/** The gate's parameter in radians, or null after reporting why it has none. */
function resolveRotationAngle(
    ctx: GateCallStatementContext,
    identifier: OperationIdentifier,
    gateName: string,
    builder: CircuitBuilder,
): number | null {
    const { hasRotationAngle } = GATE_ARITY[identifier];
    const expressions = ctx.expressionList()?.expression() ?? [];

    if (!hasRotationAngle) {
        if (expressions.length === 0) return 0;

        builder.invalid(ctx, identifier, `Gate '${gateName}' does not take a parameter.`);
        return null;
    }

    // Defaulting to 0 would write the angle into the file on the next edit.
    if (expressions.length === 0) {
        builder.invalid(ctx, identifier, `Gate '${gateName}' takes one parameter, as in ${gateName}(pi/2).`);
        return null;
    }

    // Reading only the first parameter would lose the rest on write.
    if (expressions.length > 1) {
        builder.invalid(ctx, identifier, `Gate '${gateName}' takes one parameter but got ${expressions.length}.`);
        return null;
    }

    try {
        return evaluateAngle(expressions[0]);
    } catch (error) {
        builder.reject(ctx, identifier, error instanceof QasmUnsupportedError ? error.message : String(error));
        return null;
    }
}

function checkNoModifiersOrDesignator(ctx: GateCallStatementContext, builder: CircuitBuilder): boolean {
    if (ctx.gateModifier().length > 0) {
        builder.reject(ctx, 'gateModifier', `Gate modifiers are not supported: ${builder.excerpt(ctx)}`);
        return false;
    }

    // The `[4]` in `h[4] q;`, a timing designator the circuit model does not carry.
    if (ctx.designator()) {
        builder.reject(ctx, 'gateCallStatement', `Gate designators are not supported: ${builder.excerpt(ctx)}`);
        return false;
    }

    return true;
}

function resolveSupportedGate(
    gateName: string,
    ctx: GateCallStatementContext,
    builder: CircuitBuilder,
): OperationIdentifier | undefined {
    // A name OpenQASM never declares is a defect in the document, not a gap in this
    // editor, and gate definitions of their own already make a document unsupported,
    // so nothing else could have introduced it.
    if (!isStandardGate(gateName)) {
        builder.invalid(ctx, 'gateCallStatement', `Unknown gate '${gateName}'.`);
        return undefined;
    }

    const identifier = toOperationIdentifier(gateName);
    // Support is explicit. Arity alone does not make a gate call round-trippable.
    if (!identifier || !isGateSupported(identifier)) {
        builder.reject(ctx, identifier ?? gateName.toUpperCase(), `Unsupported gate '${gateName}'.`);
        return undefined;
    }
    return identifier;
}

function parseOperands(operandList: GateOperandListContext, builder: CircuitBuilder): ElementSelectorDto[] | undefined {
    const operands: ElementSelectorDto[] = [];
    for (const operand of operandList.gateOperand()) {
        const selector = parseOperand(operand, builder);
        if (!selector) return undefined;
        operands.push(selector);
    }
    return operands;
}

/**
 * Resolves one gate operand, the `q[0]` in `h q[0]`, to a single qubit.
 *
 * OpenQASM operands can name a whole register or slice. The visual circuit model
 * needs one concrete qubit, so broader operands are rejected.
 */
function parseOperand(operand: GateOperandContext, builder: CircuitBuilder): ElementSelectorDto | null {
    const indexed = operand.indexedIdentifier();
    if (!indexed) {
        // e.g. a hardware qubit like `$0`, which the circuit model does not represent.
        builder.reject(operand, 'gateOperand', `Unsupported gate operand: ${builder.excerpt(operand)}`);
        return null;
    }

    const registerName = indexed.Identifier().getText();
    const register = builder.registerByName(registerName);
    if (!register) {
        builder.invalid(operand, 'gateOperand', `Gate references unknown qubit register '${registerName}'.`);
        return null;
    }
    const size = register.numberOfQubits;

    const indexOperators = indexed.indexOperator();
    if (indexOperators.length === 0) {
        // `h q;` is only unambiguous for a single-qubit register.
        if (size !== 1) {
            builder.reject(
                operand,
                'gateOperand',
                `'${builder.excerpt(operand)}' applies the gate to all ${size} qubits of '${registerName}'; broadcasting is not supported.`,
            );
            return null;
        }
        return { registerId: register.id, index: 0 };
    }

    if (indexOperators.length > 1) {
        builder.reject(operand, 'indexOperator', `Nested indexing is not supported: ${builder.excerpt(operand)}`);
        return null;
    }

    const indexOperator = indexOperators[0];
    const expressions = indexOperator.expression();
    // Ranges, sets and lists name more than one qubit.
    if (indexOperator.setExpression() || indexOperator.rangeExpression().length > 0 || expressions.length !== 1) {
        builder.reject(operand, 'indexOperator', `Qubit index must select a single qubit: ${builder.excerpt(operand)}`);
        return null;
    }

    const index = constantInt(expressions[0].getText());
    if (index === null) {
        builder.reject(operand, 'indexOperator', `Qubit index must be a constant integer: ${builder.excerpt(operand)}`);
        return null;
    }

    // Out-of-range gates would be invisible in the editor.
    if (index < 0 || index >= size) {
        builder.invalid(
            operand,
            'indexOperator',
            `Qubit index ${index} is outside register '${registerName}' (size ${size}).`,
        );
        return null;
    }

    return { registerId: register.id, index };
}

/** Variable or expression indices are not supported. */
const constantInt = (text: string): number | null => {
    const trimmed = text.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    return Number.parseInt(trimmed, 10);
};

const truncate = (text: string): string => (text.length > 60 ? `${text.slice(0, 60)}…` : text);

/**
 * Line of the first non-comment statement. Empty files treat all comments as header.
 */
function startOfFirstStatement(tree: ProgramContext): number {
    const versionLine = tree.version()?.start?.line;
    const firstStatementLine = tree.statementOrScope()[0]?.start?.line;

    return Math.min(versionLine ?? Number.POSITIVE_INFINITY, firstStatementLine ?? Number.POSITIVE_INFINITY);
}

/** What this document's structural comments say. One walk answers both, so they cannot disagree. */
interface StructuralComments {
    /** Keys of the comments `toQasm` would have written itself, so they are not a user's. */
    markerKeys: Set<string>;
    /** Gate-call lines written inside the layer opened above them, rather than opening one. */
    continuedLayers: Set<number>;
}

/**
 * Reads the `// Register` and `// Layer` comments back.
 *
 * A layer marker sits above the *first* operation of its layer: a gate call opens a new
 * layer only where one stands directly above it, and the calls below share that layer.
 *
 * The sequence has to read 1, 2, 3 in order. At the first comment that breaks it the
 * matching stops, because from there this is no longer a document we produced, and an
 * unrecognised comment is kept, never dropped. A file with no markers of ours never
 * enters the sequence, so every gate call keeps a layer to itself.
 */
function readStructuralComments(tree: ProgramContext, comments: readonly QasmComment[]): StructuralComments {
    const commentByLine = firstCommentPerLine(comments);

    const markerKeys = new Set<string>();
    const continuedLayers = new Set<number>();
    let expectedLayer = 1;

    for (const statementOrScope of tree.statementOrScope()) {
        const statement = statementOrScope.statement();
        if (!statement) continue;

        const declaration = statement.quantumDeclarationStatement();
        if (declaration) {
            addRegisterMarker(markerKeys, declaration);
            continue;
        }

        const line = statement.gateCallStatement()?.start?.line ?? 0;
        if (line <= 1) continue;

        const above = commentByLine.get(line - 1);
        if (above === undefined) {
            // No comment above: written as part of a layer one of our markers opened.
            if (expectedLayer > 1) continuedLayers.add(line);
            continue;
        }
        if (above !== layerMarker(expectedLayer)) break;

        markerKeys.add(commentKey(line - 1, layerMarker(expectedLayer)));
        expectedLayer += 1;
    }

    return { markerKeys, continuedLayers };
}

/** Only the first comment on a line can sit above a statement. */
function firstCommentPerLine(comments: readonly QasmComment[]): Map<number, string> {
    const byLine = new Map<number, string>();
    for (const comment of comments) {
        if (!byLine.has(comment.line)) byLine.set(comment.line, comment.text.trim());
    }
    return byLine;
}

/** A declaration with no name has no `// Register x` we could have written above it. */
function addRegisterMarker(keys: Set<string>, declaration: QuantumDeclarationStatementContext): void {
    const name = tokenText(declaration.Identifier());
    const line = declaration.start?.line ?? 0;
    if (name === null || line <= 1) return;

    keys.add(commentKey(line - 1, registerMarker(name)));
}

const commentKey = (line: number, text: string): string => `${line}:${text.trim()}`;
