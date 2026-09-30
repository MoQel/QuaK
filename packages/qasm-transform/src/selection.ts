import { isClassicRegister, type ElementSelectorDto, type RegisterResponse } from '@quak/circuit-core';
import type { CircuitBuilder } from './circuitBuilder.ts';
import {
    constantInt,
    endsWithComma,
    tokenText,
    trailingComma,
    type SourcePosition,
    type SourceSpan,
} from './parseTree.ts';
import type {
    GateOperandContext,
    GateOperandListContext,
    IndexedIdentifierContext,
    RangeExpressionContext,
} from './generated/OpenQASM3Parser.js';

/**
 * The operand lists of the single calls a gate call on registers stands for, as the backend expands them: registers
 * pair up position by position, and a single qubit repeats against them.
 */
export function broadcast(
    slots: ElementSelectorDto[][],
    ctx: SourcePosition,
    gateName: string,
    builder: CircuitBuilder,
): ElementSelectorDto[][] | null {
    const widths = [...new Set(slots.map((slot) => slot.length).filter((width) => width > 1))];
    if (widths.length > 1) {
        builder.invalid(
            ctx,
            'gateOperandList',
            `Gate '${gateName}' is called on registers of different sizes (${widths.join(' and ')}); they must match.`,
        );
        return null;
    }

    return Array.from({ length: widths[0] ?? 1 }, (_, position) =>
        slots.map((slot) => (slot.length === 1 ? slot[0] : slot[position])),
    );
}

/**
 * What an operand selects: every element of an unindexed register, one for `r[i]`, and the
 * expanded slice for `r[a:b]`, all in the order the backend expands them.
 *
 * `subject` opens the messages, as in `Gate references` or `Measurement writes to`.
 */
export function selectElements(
    ctx: SourcePosition & SourceSpan,
    indexed: IndexedIdentifierContext,
    expected: RegisterResponse['type'],
    subject: string,
    builder: CircuitBuilder,
): ElementSelectorDto[] | null {
    const kind = expected === 'Quantum_Register' ? 'qubit register' : 'classical register';
    const construct = subject.startsWith('Gate') ? 'gateOperand' : 'measureExpression';
    const registerName = tokenText(indexed.Identifier());
    if (registerName === null) {
        builder.invalid(ctx, construct, `${subject} no ${kind}.`);
        return null;
    }

    const register = builder.registerByName(registerName);
    if (!register) {
        builder.invalid(ctx, construct, `${subject} unknown ${kind} '${registerName}'.`);
        return null;
    }
    if (register.type !== expected) {
        builder.invalid(ctx, construct, `${subject} '${registerName}', which is not a ${kind}.`);
        return null;
    }

    const size = isClassicRegister(register) ? register.numberOfBits : register.numberOfQubits;
    const indices = selectedIndices(ctx, indexed, size, builder);
    if (!indices) return null;

    const outside = indices.find((index) => index < 0 || index >= size);
    if (outside !== undefined) {
        builder.invalid(ctx, 'indexOperator', `Index ${outside} is outside register '${registerName}' (size ${size}).`);
        return null;
    }
    if (indices.length === 0) {
        builder.invalid(
            ctx,
            'indexOperator',
            `Selection covers nothing in register '${registerName}': ${builder.excerpt(ctx)}`,
        );
        return null;
    }

    return indices.map((index) => ({ registerId: register.id, index }));
}

function selectedIndices(
    ctx: SourcePosition & SourceSpan,
    indexed: IndexedIdentifierContext,
    size: number,
    builder: CircuitBuilder,
): number[] | null {
    const indexOperators = indexed.indexOperator();
    if (indexOperators.length === 0) return Array.from({ length: size }, (_, index) => index);

    if (indexOperators.length > 1) {
        builder.reject(ctx, 'indexOperator', `Nested indexing is not supported: ${builder.excerpt(ctx)}`);
        return null;
    }

    const indexOperator = indexOperators[0];
    const expressions = indexOperator.expression();
    const ranges = indexOperator.rangeExpression();
    if (indexOperator.setExpression() || expressions.length + ranges.length !== 1) {
        builder.reject(ctx, 'indexOperator', `An index must select one element or one slice: ${builder.excerpt(ctx)}`);
        return null;
    }

    if (ranges.length === 1) return sliceIndices(ctx, ranges[0], size, builder);

    const index = constantInt(expressions[0].getText());
    if (index === null) {
        builder.reject(ctx, 'indexOperator', `Index must be a constant integer: ${builder.excerpt(ctx)}`);
        return null;
    }
    return [index];
}

/** `[a:b]`, `[a:step:b]` and the open `[a:]`, `[:b]`, `[:]`. The stop is inclusive, as in OpenQASM. */
function sliceIndices(
    ctx: SourcePosition & SourceSpan,
    range: RangeExpressionContext,
    size: number,
    builder: CircuitBuilder,
): number[] | null {
    const values = range.expression().map((expression) => constantInt(expression.getText()));
    if (values.includes(null)) {
        builder.reject(ctx, 'rangeExpression', `Slice bounds must be constant integers: ${builder.excerpt(ctx)}`);
        return null;
    }

    const bounds = sliceBounds(range, values as number[], size);
    if (!bounds) {
        builder.reject(ctx, 'rangeExpression', `Unsupported slice: ${builder.excerpt(ctx)}`);
        return null;
    }

    const { start, step, stop } = bounds;
    if (step === 0) {
        builder.invalid(ctx, 'rangeExpression', `A slice step cannot be zero: ${builder.excerpt(ctx)}`);
        return null;
    }

    const indices: number[] = [];
    for (let value = start; step > 0 ? value <= stop : value >= stop; value += step) {
        indices.push(value);
        if (indices.length > size) break;
    }
    return indices;
}

/** Start, step and stop of a slice, an open end standing for the register's own bound. */
function sliceBounds(
    range: RangeExpressionContext,
    values: number[],
    size: number,
): { start: number; step: number; stop: number } | null {
    const colons = range.COLON().length;
    if (colons === 2 && values.length === 3) return { start: values[0], step: values[1], stop: values[2] };
    if (colons !== 1) return null;

    const whole = { start: 0, step: 1, stop: size - 1 };
    if (values.length === 0) return whole;
    if (values.length === 2) return { ...whole, start: values[0], stop: values[1] };

    // One endpoint: `[2:]` counts up from it, `[:2]` counts up to it.
    return range.getChild(0) === range.expression()[0] ? { ...whole, start: values[0] } : { ...whole, stop: values[0] };
}

/** One list of qubits per operand: a single qubit, or those of a register or slice. */
export function parseOperands(
    operandList: GateOperandListContext,
    builder: CircuitBuilder,
): ElementSelectorDto[][] | undefined {
    const slots: ElementSelectorDto[][] = [];
    for (const operand of operandList.gateOperand()) {
        const slot = parseOperand(operand, builder);
        if (!slot) return undefined;
        slots.push(slot);
    }

    if (endsWithComma(operandList, slots.length)) {
        builder.reject(operandList, 'gateOperandList', trailingComma(builder.excerpt(operandList)));
        return undefined;
    }

    return slots;
}

/** The qubits one gate operand names: `q[0]`, a whole register `q`, or a slice `q[0:1]`. */
function parseOperand(operand: GateOperandContext, builder: CircuitBuilder): ElementSelectorDto[] | null {
    const indexed = operand.indexedIdentifier();
    if (!indexed) {
        // e.g. a hardware qubit like `$0`, which the circuit model does not represent.
        builder.reject(operand, 'gateOperand', `Unsupported gate operand: ${builder.excerpt(operand)}`);
        return null;
    }

    return selectElements(operand, indexed, 'Quantum_Register', 'Gate references', builder);
}
