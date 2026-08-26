import {
    AdditiveExpressionContext,
    ExpressionContext,
    MultiplicativeExpressionContext,
    OpenQASM3Parser,
    ParenthesisExpressionContext,
    PowerExpressionContext,
    UnaryExpressionContext,
} from './generated/OpenQASM3Parser.js';

/** Raised when a syntactically valid angle cannot be represented by the circuit model. */
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

    // Own properties only: prototype keys such as `__proto__` are not constants.
    if (Object.hasOwn(NAMED_CONSTANTS, normalized)) return NAMED_CONSTANTS[normalized];

    const value = Number(normalized);
    if (Number.isFinite(value) && normalized !== '') return value;

    throw new QasmUnsupportedError(`Could not evaluate angle expression '${text}'.`);
};

/**
 * Evaluates a gate parameter, the `pi/2` in `rx(pi/2) q[0]`, to radians.
 *
 * Mirrors the backend's `QasmCircuitVisitor.evaluateAngle`. Supports named
 * constants, numeric literals and simple arithmetic; variables and calls are
 * rejected instead of guessed.
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
