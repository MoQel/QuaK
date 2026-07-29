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
} from '@quak/circuit-core';
import { evaluateAngle, QasmUnsupportedError } from './angleExpression.ts';
import { isStructuralComment } from './structuralComments.ts';
import { parseQasm, type QasmSyntaxError } from './parse.ts';
import {
    GateCallStatementContext,
    GateOperandContext,
    QuantumDeclarationStatementContext,
    StatementContext,
    type ProgramContext,
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
 * They have to survive the round trip: the backend's generator emits neither,
 * so its output is not even valid standalone OpenQASM (no version, and `h`/`cx`
 * used without including the standard gates). Regenerating over the user's file
 * must not quietly delete their header, so it is captured here and written back.
 */
export interface QasmPreamble {
    /** e.g. "3.0" from `OPENQASM 3.0;`. */
    version: string | null;
    /** Include targets verbatim, in source order, e.g. `"stdgates.inc"`. */
    includes: string[];
    /**
     * Comments above the first statement — a licence block, an author, a note on
     * what the file is. The only comments that can be preserved honestly: their
     * anchor is "the top of the file", which no amount of re-scheduling moves.
     * Comments further down belong to statements that the editor may reorder or
     * delete, so they are reported as unsupported instead of being relocated.
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

/** The document may only be edited visually when nothing was lost reading it (D2). */
export const isEditable = (result: ToCircuitResult): boolean =>
    result.content !== null && result.syntaxErrors.length === 0 && result.unsupported.length === 0;

// What counts as outside the subset is the support matrix's call, not this
// file's — that single source is what D8 asks for, and it is what keeps the
// visitor, the tests and the README from each believing something different.
const UNSUPPORTED_STATEMENTS = unsupportedStatementRules();

class CircuitBuilder {
    // Only quantum registers: a `bit[n] c;` declaration is a classical register
    // the circuit model does not carry, and it is rejected rather than collected.
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
 * Port of the backend's `QasmCircuitVisitor`, with one deliberate difference:
 * where the Java visitor throws on the first problem and silently walks past
 * statements it does not implement, this one collects every issue. The extension
 * needs the whole list to tell the user *why* their file is read-only, and a
 * construct that is quietly ignored is exactly the silent data loss D2 forbids.
 *
 * Each operation becomes its own layer, in source order — the editor re-schedules
 * them ASAP for display, so layer packing is not this function's business.
 *
 * Ids are derived from the source (register name, statement position) rather than
 * generated. The extension re-parses on every keystroke, and fresh UUIDs each time
 * would change every React key — remounting the circuit and dropping any in-flight
 * drag. Derived ids stay put as long as the statement does.
 */
export function toCircuit(source: string): ToCircuitResult {
    const { tree, errors, comments } = parseQasm(source);
    const builder = new CircuitBuilder();

    // Comments never reach the parse tree, so the statement walk below cannot see
    // them. Three kinds, and only one is a problem:
    //   - QuaK's own `// Register`/`// Layer` markers: regenerable, so ignored.
    //   - above the first statement: anchored to the top of the file, preserved.
    //   - anywhere else: anchored to a statement the editor may move or delete,
    //     so they are reported and the document goes read-only.
    const firstStatementLine = startOfFirstStatement(tree);
    const headerComments: string[] = [];

    for (const comment of comments) {
        if (isStructuralComment(comment.text)) continue;

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
        // Registers alone are a valid (empty) circuit; nothing at all is not.
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

    // Not circuit content, but part of the document — kept so the generator can
    // put it back instead of deleting the user's header.
    const include = statement.includeStatement();
    if (include) {
        builder.includes.push(include.StringLiteral().getText());
        return;
    }

    // Anything else: name it if we can, and reject it either way. The accessors
    // exist on StatementContext for *every* alternative, so the rule has to be
    // identified by calling them — a truthy return is the one that matched.
    const rule = Object.keys(UNSUPPORTED_STATEMENTS).find((name) => {
        const accessor = (statement as unknown as Record<string, unknown>)[name];
        return typeof accessor === 'function' && (accessor as () => unknown).call(statement) != null;
    });
    const reason = rule ? UNSUPPORTED_STATEMENTS[rule] : 'unrecognized statement';
    builder.reject(statement, rule ?? 'statement', `Unsupported ${reason}: ${firstLine(statement.getText())}`);
}

function visitQuantumDeclaration(ctx: QuantumDeclarationStatementContext, builder: CircuitBuilder): void {
    const name = ctx.Identifier().getText();
    const designator = ctx.qubitType().designator();

    let size = 1; // `qubit q;` with no [n] is a single qubit.
    if (designator) {
        const parsed = constantInt(designator.expression().getText());
        if (parsed === null) {
            builder.reject(ctx, 'qubitType', `Register size must be a constant integer: ${ctx.getText()}`);
            return;
        }
        size = parsed;
    }

    const existing = builder.registerByName(name);
    if (existing) {
        existing.numberOfQubits = size;
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
        builder.reject(ctx, 'gateCallStatement', `Unsupported gate call: ${firstLine(ctx.getText())}`);
        return;
    }

    if (ctx.gateModifier().length > 0) {
        builder.reject(ctx, 'gateModifier', `Gate modifiers are not supported: ${firstLine(ctx.getText())}`);
        return;
    }

    const gateName = identifierNode.getText();
    const identifier = toOperationIdentifier(gateName);
    // The matrix decides support; GATE_ARITY only says what shape a gate has.
    // MEASURE has an arity but is not a gate call, so it is rightly rejected here.
    if (!identifier || !isGateSupported(identifier)) {
        builder.reject(ctx, identifier ?? gateName.toUpperCase(), `Unsupported gate '${gateName}'.`);
        return;
    }

    const operands: ElementSelectorDto[] = [];
    for (const operand of operandList.gateOperand()) {
        const selector = parseOperand(operand, builder);
        if (!selector) return;
        operands.push(selector);
    }

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

    let index = 0;
    const indexOperators = indexed.indexOperator();
    if (indexOperators.length > 0) {
        const expressions = indexOperators[0].expression();
        if (expressions.length > 0) {
            const parsed = constantInt(expressions[0].getText());
            if (parsed === null) {
                builder.reject(
                    operand,
                    'indexOperator',
                    `Qubit index must be a constant integer: ${operand.getText()}`,
                );
                return null;
            }
            index = parsed;
        }
    }

    return { registerId: register.id, index };
}

/** Variable or expression indices are not supported — the backend rejects them too. */
const constantInt = (text: string): number | null => {
    const trimmed = text.trim();
    if (!/^-?\d+$/.test(trimmed)) return null;
    return Number.parseInt(trimmed, 10);
};

const firstLine = (text: string): string => (text.length > 60 ? `${text.slice(0, 60)}…` : text);

/**
 * Line of the first thing that is not a comment — the boundary between "header"
 * and "the body". Infinity for a file with no statements at all, so every comment
 * in it counts as header.
 */
function startOfFirstStatement(tree: ProgramContext): number {
    const versionLine = tree.version()?.start?.line;
    const firstStatementLine = tree.statementOrScope()[0]?.start?.line;

    return Math.min(versionLine ?? Number.POSITIVE_INFINITY, firstStatementLine ?? Number.POSITIVE_INFINITY);
}
