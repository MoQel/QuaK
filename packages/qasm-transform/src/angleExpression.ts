import {
    AdditiveExpressionContext,
    ExpressionContext,
    MultiplicativeExpressionContext,
    OpenQASM3Parser,
    ParenthesisExpressionContext,
    PowerExpressionContext,
    UnaryExpressionContext,
} from './generated/OpenQASM3Parser.js';

/** Raised for anything inside the grammar that the circuit model cannot represent. */
export class QasmUnsupportedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'QasmUnsupportedError';
    }
}

const NAMED_CONSTANTS: Record<string, number> = {
    pi: Math.PI,
    π: Math.PI,
    tau: 2 * Math.PI,
    τ: 2 * Math.PI,
    euler: Math.E,
    e: Math.E,
};

const parseConstantOrNumber = (text: string): number => {
    const normalized = text.trim().toLowerCase();

    const named = NAMED_CONSTANTS[normalized];
    if (named !== undefined) return named;

    const value = Number(normalized);
    if (Number.isFinite(value) && normalized !== '') return value;

    throw new QasmUnsupportedError(`Could not evaluate angle expression '${text}'.`);
};

/**
 * Evaluates a gate parameter — the `pi/2` in `rx(pi/2) q[0]` — to radians.
 *
 * Port of the backend's `QasmCircuitVisitor.evaluateAngle`, and it has to stay
 * one: the editor shows the angle, the generator writes it back, and a value
 * that differs by so much as a sign would silently corrupt the user's file.
 *
 * Supports the named constants, numeric literals and simple arithmetic. Anything
 * else (a variable, a function call) is genuinely unsupported rather than
 * guessed at.
 */
export function evaluateAngle(expression: ExpressionContext): number {
    if (expression instanceof ParenthesisExpressionContext) {
        return evaluateAngle(expression.expression());
    }

    if (expression instanceof UnaryExpressionContext) {
        const value = evaluateAngle(expression.expression());
        return expression._op?.type === OpenQASM3Parser.MINUS ? -value : value;
    }

    if (expression instanceof PowerExpressionContext) {
        const [base, exponent] = expression.expression();
        return Math.pow(evaluateAngle(base), evaluateAngle(exponent));
    }

    if (expression instanceof MultiplicativeExpressionContext) {
        const [leftCtx, rightCtx] = expression.expression();
        const left = evaluateAngle(leftCtx);
        const right = evaluateAngle(rightCtx);

        switch (expression._op?.type) {
            case OpenQASM3Parser.ASTERISK:
                return left * right;
            case OpenQASM3Parser.SLASH:
                return left / right;
            case OpenQASM3Parser.PERCENT:
                return left % right;
            default:
                throw new QasmUnsupportedError(`Unsupported operator in angle expression '${expression.getText()}'.`);
        }
    }

    if (expression instanceof AdditiveExpressionContext) {
        const [leftCtx, rightCtx] = expression.expression();
        const left = evaluateAngle(leftCtx);
        const right = evaluateAngle(rightCtx);
        return expression._op?.type === OpenQASM3Parser.PLUS ? left + right : left - right;
    }

    return parseConstantOrNumber(expression.getText());
}
