package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import java.util.HashMap;
import java.util.Map;

/**
 * Evaluates constant OpenQASM expressions (rotation angles, qubit indices, register sizes, loop
 * bounds) to numeric values. Supports numeric literals, the built-in constants pi/tau/euler,
 * bound variables (loop counters and {@code const} declarations), and the arithmetic operators
 * +, -, *, /, %, ** and unary minus. Anything depending on runtime values is rejected with a
 * {@link QasmParseException}.
 */
class QasmExpressionEvaluator {

    private final Map<String, Double> variables = new HashMap<>();

    /**
     * Binds a variable, returning the previous value (or null if unbound) so callers can restore
     * it via {@link #restore} — loop variables may shadow an outer binding of the same name.
     */
    Double bind(String name, double value) {
        return variables.put(name, value);
    }

    void restore(String name, Double previousValue) {
        if (previousValue == null) {
            variables.remove(name);
        } else {
            variables.put(name, previousValue);
        }
    }

    double evaluate(OpenQASM3Parser.ExpressionContext expr) {
        return switch (expr) {
            case OpenQASM3Parser.ParenthesisExpressionContext p -> evaluate(p.expression());
            case OpenQASM3Parser.UnaryExpressionContext u -> {
                if (u.op.getType() != OpenQASM3Parser.MINUS) {
                    throw new QasmParseException(
                        "Unsupported operator '%s' in constant expression '%s'.".formatted(u.op.getText(), expr.getText())
                    );
                }
                yield -evaluate(u.expression());
            }
            case OpenQASM3Parser.PowerExpressionContext pw -> Math.pow(
                evaluate(pw.expression().getFirst()),
                evaluate(pw.expression().getLast())
            );
            case OpenQASM3Parser.MultiplicativeExpressionContext m -> {
                double left = evaluate(m.expression().getFirst());
                double right = evaluate(m.expression().getLast());
                yield switch (m.op.getType()) {
                    case OpenQASM3Parser.ASTERISK -> left * right;
                    case OpenQASM3Parser.SLASH -> left / right;
                    case OpenQASM3Parser.PERCENT -> left % right;
                    default -> 0.0;
                };
            }
            case OpenQASM3Parser.AdditiveExpressionContext a -> {
                double left = evaluate(a.expression().getFirst());
                double right = evaluate(a.expression().getLast());
                yield a.op.getType() == OpenQASM3Parser.PLUS ? left + right : left - right;
            }
            default -> parseConstantOrNumber(expr.getText());
        };
    }

    /** Evaluates an expression that must yield an integer (qubit index, register size, loop bound). */
    long evaluateInt(OpenQASM3Parser.ExpressionContext expr, String context) {
        double value = evaluate(expr);
        if (Double.isNaN(value) || Double.isInfinite(value) || value != Math.floor(value)) {
            throw new QasmParseException("Expected a constant integer for %s but got '%s'.".formatted(context, expr.getText()));
        }
        return (long) value;
    }

    private double parseConstantOrNumber(String text) {
        String trimmed = text.trim();

        // Bound variables (loop counters, const declarations) shadow the built-in constants, so
        // e.g. a loop variable named "e" is not mistaken for Euler's number.
        Double bound = variables.get(trimmed);
        if (bound != null) {
            return bound;
        }

        return switch (trimmed.toLowerCase()) {
            case "pi", "π" -> Math.PI;
            case "tau", "τ" -> Math.TAU;
            case "euler", "e" -> Math.E;
            default -> {
                try {
                    yield Double.parseDouble(trimmed);
                } catch (NumberFormatException ex) {
                    if (trimmed.matches("[A-Za-z_][A-Za-z0-9_]*")) {
                        throw new QasmParseException(
                            "Unknown identifier '%s' in constant expression: only loop variables and const declarations can be used.".formatted(
                                trimmed
                            )
                        );
                    }
                    throw new QasmParseException("Could not evaluate constant expression '" + text + "'.");
                }
            }
        };
    }
}
