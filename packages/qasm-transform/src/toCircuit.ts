import {
    GATE_ARITY,
    isGateSupported,
    isQuantumRegister,
    isStandardGate,
    toOperationIdentifier,
    unsupportedStatementRules,
    type CircuitContent,
    type MeasurementDto,
    type OperationIdentifier,
    type QuantumOperationDto,
    type RegisterResponse,
} from '@quak/circuit-core';
import { evaluateAngle, QasmUnsupportedError } from './angleExpression.ts';
import { CircuitBuilder, type QasmRejection } from './circuitBuilder.ts';
import { parseQasm, type QasmSyntaxError } from './parse.ts';
import {
    constantInt,
    endsWithComma,
    tokenText,
    trailingComma,
    type SourcePosition,
    type SourceSpan,
} from './parseTree.ts';
import { broadcast, parseOperands, selectElements } from './selection.ts';
import { commentKey, readStructuralComments } from './structuralComments.ts';
import type {
    ClassicalDeclarationStatementContext,
    DesignatorContext,
    GateCallStatementContext,
    IndexedIdentifierContext,
    MeasureExpressionContext,
    OldStyleDeclarationStatementContext,
    ProgramContext,
    QuantumDeclarationStatementContext,
    StatementContext,
} from './generated/OpenQASM3Parser.js';

/** What frames the circuit in the file: version, includes and the comments above them. Kept for the rewrite. */
export interface QasmPreamble {
    /** e.g. "3.0" from `OPENQASM 3.0;`. */
    version: string | null;
    /** Include targets verbatim, in source order, e.g. `"stdgates.inc"`. */
    includes: string[];
    /** Comments before the first statement. Later ones are reported as unsupported. */
    headerComments: string[];
}

export interface ToCircuitResult {
    /** Null when the document cannot be represented as a circuit at all. */
    content: CircuitContent | null;
    preamble: QasmPreamble;
    syntaxErrors: QasmSyntaxError[];
    unsupported: QasmRejection[];
}

const UNSUPPORTED_STATEMENTS = unsupportedStatementRules();

/**
 * Turns OpenQASM 3 or 2 source into the circuit's registers and layers, and records every construct it cannot write
 * back. Layers are read as the document writes them. Ids come from source positions, so they stay stable across
 * reparses.
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
        content: builder.registers.some((register) => isQuantumRegister(register)) ? content : null,
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

    const classical = statement.classicalDeclarationStatement();
    if (classical) {
        visitClassicalDeclaration(classical, builder);
        return;
    }

    const oldStyle = statement.oldStyleDeclarationStatement();
    if (oldStyle) {
        visitOldStyleDeclaration(oldStyle, builder);
        return;
    }

    const gateCall = statement.gateCallStatement();
    if (gateCall) {
        visitGateCall(gateCall, builder);
        return;
    }

    const measurement = statement.measureArrowAssignmentStatement();
    if (measurement) {
        visitMeasurement(measurement, measurement.measureExpression(), measurement.indexedIdentifier(), builder);
        return;
    }

    // `c = measure q;` is the other spelling of `measure q -> c;`. Any other assignment is classical computation.
    const assignment = statement.assignmentStatement();
    const measured = assignment?.EQUALS() ? assignment.measureExpression() : null;
    if (assignment && measured) {
        visitMeasurement(assignment, measured, assignment.indexedIdentifier(), builder);
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

    const size = registerSize(ctx, ctx.qubitType().designator(), 'qubitType', builder);
    if (size === null) return;

    declareRegister(ctx, 'quantumDeclarationStatement', quantumRegister(name, size), builder);
}

/** `bit[n] c;` is the OpenQASM 3 spelling of `creg c[n];`. Every other type is classical computation. */
function visitClassicalDeclaration(ctx: ClassicalDeclarationStatementContext, builder: CircuitBuilder): void {
    const bitType = ctx.scalarType()?.BIT() ? ctx.scalarType() : null;
    if (!bitType) {
        builder.reject(
            ctx,
            'scalarType',
            `Only bit registers are supported as classical declarations: ${builder.excerpt(ctx)}`,
        );
        return;
    }

    // Writing the register back as `bit[n] c;` would drop the value.
    if (ctx.declarationExpression()) {
        builder.reject(
            ctx,
            'declarationExpression',
            `Initialized bit registers are not supported: ${builder.excerpt(ctx)}`,
        );
        return;
    }

    const name = tokenText(ctx.Identifier());
    if (name === null) {
        builder.invalid(ctx, 'classicalDeclarationStatement', 'This classical register has no name.');
        return;
    }

    const size = registerSize(ctx, bitType.designator(), 'scalarType', builder);
    if (size === null) return;

    declareRegister(ctx, 'classicalDeclarationStatement', classicRegister(name, size), builder);
}

/** `qreg q[n];` and `creg c[n];`, which OpenQASM 3 still accepts. They are written back in the newer spelling. */
function visitOldStyleDeclaration(ctx: OldStyleDeclarationStatementContext, builder: CircuitBuilder): void {
    const name = tokenText(ctx.Identifier());
    if (name === null) {
        builder.invalid(ctx, 'oldStyleDeclarationStatement', 'This register has no name.');
        return;
    }

    const size = registerSize(ctx, ctx.designator(), 'designator', builder);
    if (size === null) return;

    const register = ctx.QREG() ? quantumRegister(name, size) : classicRegister(name, size);
    declareRegister(ctx, 'oldStyleDeclarationStatement', register, builder);
}

const quantumRegister = (name: string, numberOfQubits: number): RegisterResponse => ({
    id: `qreg:${name}`,
    name,
    type: 'Quantum_Register',
    numberOfQubits,
});

const classicRegister = (name: string, numberOfBits: number): RegisterResponse => ({
    id: `creg:${name}`,
    name,
    type: 'Classic_Register',
    numberOfBits,
});

/** The declared size, 1 without a designator, or null after reporting why it is not a positive constant. */
function registerSize(
    ctx: SourcePosition & SourceSpan,
    designator: DesignatorContext | null,
    construct: string,
    builder: CircuitBuilder,
): number | null {
    if (!designator) return 1;

    const size = constantInt(designator.expression().getText());
    if (size === null || size < 1) {
        builder.reject(ctx, construct, `Register size must be a positive constant integer: ${builder.excerpt(ctx)}`);
        return null;
    }
    return size;
}

function declareRegister(
    ctx: SourcePosition,
    construct: string,
    register: RegisterResponse,
    builder: CircuitBuilder,
): void {
    // Duplicate declarations would make earlier indices ambiguous.
    const existing = builder.registerByName(register.name);
    if (existing) {
        const kind = isQuantumRegister(existing) ? 'qubit register' : 'classical register';
        builder.invalid(
            ctx,
            construct,
            existing.type === register.type
                ? `A ${kind} '${register.name}' is declared more than once.`
                : `'${register.name}' is already declared as a ${kind}.`,
        );
        return;
    }

    builder.registers.push(register);
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

    const slots = parseOperands(operandList, builder);
    if (!slots) return;

    const { controlSize, targetSize, type } = GATE_ARITY[identifier];
    const expected = controlSize + targetSize;
    if (slots.length !== expected) {
        const qubits = expected === 1 ? 'qubit' : 'qubits';
        builder.invalid(ctx, identifier, `Gate '${gateName}' takes ${expected} ${qubits}, not ${slots.length}.`);
        return;
    }

    const calls = broadcast(slots, ctx, gateName, builder);
    if (!calls) return;

    const rotationAngle = resolveRotationAngle(ctx, identifier, gateName, builder);
    if (rotationAngle === null) return;

    const line = ctx.start?.line ?? 0;
    const id = `op:${line}:${ctx.start?.column ?? 0}`;
    const operations = calls.map(
        (operands, position) =>
            ({
                id: calls.length === 1 ? id : `${id}:${position}`,
                type,
                identifier,
                inverseForm: false,
                // OpenQASM lists controls before targets.
                targetQubits: operands.slice(controlSize),
                controlQubits: operands.slice(0, controlSize),
                rotationAngle,
            }) as QuantumOperationDto,
    );

    builder.place(operations, line);
}

/**
 * `measure q[0] -> c[0];` and `c[0] = measure q[0];`, one operation per measured qubit.
 *
 * Each side names one index, a slice or a whole register, paired position by position.
 */
function visitMeasurement(
    ctx: SourcePosition & SourceSpan,
    measure: MeasureExpressionContext | null,
    target: IndexedIdentifierContext | null,
    builder: CircuitBuilder,
): void {
    if (!measure) {
        builder.reject(ctx, 'measureArrowAssignmentStatement', `Unsupported measurement: ${builder.excerpt(ctx)}`);
        return;
    }

    if (!target) {
        builder.reject(
            ctx,
            'measureArrowAssignmentStatement',
            `A measurement must assign its result to a classic bit, as in measure q[0] -> c[0]: ${builder.excerpt(ctx)}`,
        );
        return;
    }

    const operand = measure.gateOperand();
    if (!operand) {
        builder.invalid(ctx, 'measureExpression', 'This measurement names no qubit.');
        return;
    }

    const measured = operand.indexedIdentifier();
    if (!measured) {
        // e.g. a hardware qubit like `$0`, which the circuit model does not represent.
        builder.reject(operand, 'gateOperand', `Unsupported measurement operand: ${builder.excerpt(operand)}`);
        return;
    }

    const qubits = selectElements(operand, measured, 'Quantum_Register', 'Measurement reads', builder);
    const bits = selectElements(target, target, 'Classic_Register', 'Measurement writes to', builder);
    if (!qubits || !bits) return;

    if (qubits.length !== bits.length) {
        builder.invalid(
            ctx,
            'measureExpression',
            `Measurement assigns ${qubits.length} qubit(s) to ${bits.length} classic bit(s); both sides must be the same width: ${builder.excerpt(ctx)}`,
        );
        return;
    }

    const line = ctx.start?.line ?? 0;
    const id = `op:${line}:${ctx.start?.column ?? 0}`;
    const operations = qubits.map(
        (qubit, position): MeasurementDto => ({
            id: qubits.length === 1 ? id : `${id}:${position}`,
            type: 'MEASUREMENT',
            identifier: 'MEASURE',
            inverseForm: false,
            targetQubits: [qubit],
            controlQubits: [],
            classicBits: [bits[position]],
        }),
    );

    builder.place(operations, line);
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

    const parameters = ctx.expressionList();
    if (parameters && endsWithComma(parameters, expressions.length)) {
        builder.reject(parameters, 'expressionList', trailingComma(builder.excerpt(parameters)));
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
    // Gate definitions already make a document unsupported, so an unknown name is an error in the document.
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

/** Line of the first non-comment statement. In an empty file every comment is header. */
function startOfFirstStatement(tree: ProgramContext): number {
    const versionLine = tree.version()?.start?.line;
    const firstStatementLine = tree.statementOrScope()[0]?.start?.line;

    return Math.min(versionLine ?? Number.POSITIVE_INFINITY, firstStatementLine ?? Number.POSITIVE_INFINITY);
}
