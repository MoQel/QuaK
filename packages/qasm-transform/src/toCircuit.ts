import {
    GATE_ARITY,
    isGateSupported,
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

export interface QasmUnsupportedConstruct {
    line: number;
    column: number;
    /** Grammar rule or gate name, for the support matrix. */
    construct: string;
    message: string;
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
    unsupported: QasmUnsupportedConstruct[];
}

/** Why a document is, or is not, editable through the circuit view. */
export type DocumentClassification =
    | { kind: 'editable' }
    | { kind: 'invalid'; syntaxErrors: QasmSyntaxError[] }
    | { kind: 'unsupportedVersion'; version: string }
    | { kind: 'unsupported'; constructs: QasmUnsupportedConstruct[] }
    | { kind: 'commentsOnly'; comments: QasmUnsupportedConstruct[] }
    | { kind: 'empty' }
    | { kind: 'noRegister' };

const SUPPORTED_MAJOR_VERSION = '3';

/** `OPENQASM 3;` and `OPENQASM 3.0;` declare the same major version. */
const majorVersion = (version: string): string => version.split('.')[0];

/** Comments are the one rejection a user can knowingly accept, so they stand apart. */
const isComment = (entry: QasmUnsupportedConstruct): boolean => entry.construct === 'comment';

/**
 * Names the single most useful reason a document cannot be edited visually.
 *
 * The order of the checks is the design: whatever matches first is the cause, and
 * most of what follows is a consequence of it.
 */
export function classify(result: ToCircuitResult): DocumentClassification {
    if (result.syntaxErrors.length > 0) {
        return { kind: 'invalid', syntaxErrors: result.syntaxErrors };
    }

    const { version, includes, headerComments } = result.preamble;
    if (version !== null && majorVersion(version) !== SUPPORTED_MAJOR_VERSION) {
        return { kind: 'unsupportedVersion', version };
    }

    // Ahead of the register checks: `qreg q[2];` does declare one, just not readably.
    const constructs = result.unsupported.filter((entry) => !isComment(entry));
    if (constructs.length > 0) {
        return { kind: 'unsupported', constructs };
    }

    if (result.content === null) {
        const nothingWritten = version === null && includes.length === 0 && headerComments.length === 0;
        return nothingWritten ? { kind: 'empty' } : { kind: 'noRegister' };
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

class CircuitBuilder {
    // Classical registers are rejected because CircuitContent carries only qubits.
    readonly registers: QuantumRegisterResponse[] = [];
    readonly layers: LayerResponse[] = [];
    readonly unsupported: QasmUnsupportedConstruct[] = [];
    readonly includes: string[] = [];

    registerByName(name: string): QuantumRegisterResponse | undefined {
        return this.registers.find((register) => register.name === name);
    }

    reject(ctx: { start: { line: number; column: number } | null }, construct: string, message: string): void {
        this.unsupported.push({
            line: ctx.start?.line ?? 0,
            column: ctx.start?.column ?? 0,
            construct,
            message,
        });
    }
}

/**
 * Turns OpenQASM 3 source into the circuit's registers and layers.
 *
 * Mirrors the backend visitor for supported constructs, but is stricter: it
 * collects unsupported syntax so the extension can keep risky files read-only.
 *
 * Each operation becomes its own layer, in source order — the editor re-schedules
 * them ASAP for display, so layer packing is not this function's business.
 *
 * Ids are derived from source positions so React keys stay stable across reparses.
 */
export function toCircuit(source: string): ToCircuitResult {
    const { tree, errors, comments } = parseQasm(source);
    const builder = new CircuitBuilder();

    const firstStatementLine = startOfFirstStatement(tree);
    const generatedMarkerKeys = generatedStructuralMarkerKeys(tree, comments);
    const headerComments: string[] = [];

    for (const comment of comments) {
        if (generatedMarkerKeys.has(commentKey(comment.line, comment.text))) continue;

        if (comment.line < firstStatementLine) {
            headerComments.push(comment.text.trim());
            continue;
        }

        builder.unsupported.push({
            line: comment.line,
            column: comment.column,
            construct: 'comment',
            message: 'Comments below the header would be lost when the circuit is written back.',
        });
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
            version: tree.version()?.VersionSpecifier().getText() ?? null,
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
        builder.includes.push(include.StringLiteral().getText());
        return;
    }

    // The generated StatementContext exposes every alternative as an accessor.
    const rule = Object.keys(UNSUPPORTED_STATEMENTS).find((name) => {
        const accessor = (statement as unknown as Record<string, unknown>)[name];
        return typeof accessor === 'function' && (accessor as () => unknown).call(statement) != null;
    });
    const reason = rule ? UNSUPPORTED_STATEMENTS[rule] : 'unrecognized statement';
    builder.reject(statement, rule ?? 'statement', `Unsupported ${reason}: ${truncate(statement.getText())}`);
}

function visitQuantumDeclaration(ctx: QuantumDeclarationStatementContext, builder: CircuitBuilder): void {
    const name = ctx.Identifier().getText();
    const designator = ctx.qubitType().designator();

    let size = 1; // `qubit q;` with no [n] is a single qubit.
    if (designator) {
        const parsed = constantInt(designator.expression().getText());
        if (parsed === null || parsed < 1) {
            builder.reject(ctx, 'qubitType', `Register size must be a positive constant integer: ${ctx.getText()}`);
            return;
        }
        size = parsed;
    }

    // Duplicate declarations would make earlier gate indices ambiguous.
    if (builder.registerByName(name)) {
        builder.reject(ctx, 'quantumDeclarationStatement', `Qubit register '${name}' is declared more than once.`);
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
        builder.reject(ctx, 'gateCallStatement', `Unsupported gate call: ${truncate(ctx.getText())}`);
        return;
    }

    if (!checkNoModifiersOrDesignator(ctx, builder)) return;

    const gateName = identifierNode.getText();
    const identifier = resolveSupportedGate(gateName, ctx, builder);
    if (!identifier) return;

    const operands = parseOperands(operandList, builder);
    if (!operands) return;

    const { controlSize, targetSize, type, hasRotationAngle } = GATE_ARITY[identifier];
    if (operands.length !== controlSize + targetSize) {
        builder.reject(
            ctx,
            identifier,
            `Gate '${gateName}' expects ${controlSize + targetSize} qubit(s) but got ${operands.length}.`,
        );
        return;
    }

    // OpenQASM lists controls before targets.
    const controlQubits = operands.slice(0, controlSize);
    const targetQubits = operands.slice(controlSize);

    let rotationAngle = 0;
    const angleExpressions = ctx.expressionList()?.expression() ?? [];
    if (angleExpressions.length > 0) {
        if (!hasRotationAngle) {
            builder.reject(ctx, identifier, `Gate '${gateName}' does not take a parameter.`);
            return;
        }
        // Reading only the first parameter would lose the rest on write.
        if (angleExpressions.length > 1) {
            builder.reject(
                ctx,
                identifier,
                `Gate '${gateName}' takes one parameter but got ${angleExpressions.length}.`,
            );
            return;
        }
        try {
            rotationAngle = evaluateAngle(angleExpressions[0]);
        } catch (error) {
            const message = error instanceof QasmUnsupportedError ? error.message : String(error);
            builder.reject(ctx, identifier, message);
            return;
        }
    }

    const operation = {
        id: `op:${ctx.start?.line ?? 0}:${ctx.start?.column ?? 0}`,
        type,
        identifier,
        inverseForm: false,
        targetQubits,
        controlQubits,
        rotationAngle,
    } as QuantumOperationDto;

    builder.layers.push({ quantumOperations: [operation] });
}

function checkNoModifiersOrDesignator(ctx: GateCallStatementContext, builder: CircuitBuilder): boolean {
    if (ctx.gateModifier().length > 0) {
        builder.reject(ctx, 'gateModifier', `Gate modifiers are not supported: ${truncate(ctx.getText())}`);
        return false;
    }

    // The `[4]` in `h[4] q;` — a timing designator the circuit model does not carry.
    if (ctx.designator()) {
        builder.reject(ctx, 'gateCallStatement', `Gate designators are not supported: ${truncate(ctx.getText())}`);
        return false;
    }

    return true;
}

function resolveSupportedGate(
    gateName: string,
    ctx: GateCallStatementContext,
    builder: CircuitBuilder,
): OperationIdentifier | undefined {
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
 * Resolves one gate operand — the `q[0]` in `h q[0]` — to a single qubit.
 *
 * OpenQASM operands can name a whole register or slice. The visual circuit model
 * needs one concrete qubit, so broader operands are rejected.
 */
function parseOperand(operand: GateOperandContext, builder: CircuitBuilder): ElementSelectorDto | null {
    const indexed = operand.indexedIdentifier();
    if (!indexed) {
        // e.g. a hardware qubit like `$0`, which the circuit model does not represent.
        builder.reject(operand, 'gateOperand', `Unsupported gate operand: ${operand.getText()}`);
        return null;
    }

    const registerName = indexed.Identifier().getText();
    const register = builder.registerByName(registerName);
    if (!register) {
        builder.reject(operand, 'gateOperand', `Gate references unknown qubit register '${registerName}'.`);
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
                `'${operand.getText()}' applies the gate to all ${size} qubits of '${registerName}'; broadcasting is not supported.`,
            );
            return null;
        }
        return { registerId: register.id, index: 0 };
    }

    if (indexOperators.length > 1) {
        builder.reject(operand, 'indexOperator', `Nested indexing is not supported: ${operand.getText()}`);
        return null;
    }

    const indexOperator = indexOperators[0];
    const expressions = indexOperator.expression();
    // Ranges, sets and lists name more than one qubit.
    if (indexOperator.setExpression() || indexOperator.rangeExpression().length > 0 || expressions.length !== 1) {
        builder.reject(operand, 'indexOperator', `Qubit index must select a single qubit: ${operand.getText()}`);
        return null;
    }

    const index = constantInt(expressions[0].getText());
    if (index === null) {
        builder.reject(operand, 'indexOperator', `Qubit index must be a constant integer: ${operand.getText()}`);
        return null;
    }

    // Out-of-range gates would be invisible in the editor.
    if (index < 0 || index >= size) {
        builder.reject(
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

/**
 * The comments in this document that `toQasm` would have written itself.
 *
 * A layer marker sits above the *first* operation of its layer, so counting gate calls
 * is wrong the moment a layer holds two — every marker below it then looks like a
 * stranger's comment, and a file QuaK wrote comes back read-only. Layers are counted
 * the way they are written instead: a gate call opens a new one only when a comment
 * stands directly above it.
 *
 * The sequence has to read 1, 2, 3 … in order. At the first comment that breaks it the
 * matching stops, because from there this is no longer a document we produced — and an
 * unrecognised comment is kept, never dropped.
 */
function generatedStructuralMarkerKeys(tree: ProgramContext, comments: readonly QasmComment[]): Set<string> {
    const commentByLine = new Map<number, string>();
    for (const comment of comments) {
        if (!commentByLine.has(comment.line)) commentByLine.set(comment.line, comment.text.trim());
    }

    const keys = new Set<string>();
    let expectedLayer = 1;

    for (const statementOrScope of tree.statementOrScope()) {
        const statement = statementOrScope.statement();
        if (!statement) continue;

        const declaration = statement.quantumDeclarationStatement();
        if (declaration) {
            addMarkerBefore(keys, declaration, registerMarker(declaration.Identifier().getText()));
            continue;
        }

        const line = statement.gateCallStatement()?.start?.line;
        if (!line || line <= 1) continue;

        const above = commentByLine.get(line - 1);
        // No comment above: the operation continues the layer that was opened earlier.
        if (above === undefined) continue;
        if (above !== layerMarker(expectedLayer)) break;

        keys.add(commentKey(line - 1, layerMarker(expectedLayer)));
        expectedLayer += 1;
    }

    return keys;
}

function addMarkerBefore(keys: Set<string>, ctx: { start: { line: number } | null }, marker: string): void {
    const statementLine = ctx.start?.line;
    if (!statementLine || statementLine <= 1) return;

    keys.add(commentKey(statementLine - 1, marker));
}

const commentKey = (line: number, text: string): string => `${line}:${text.trim()}`;
