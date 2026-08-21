package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import java.util.HashMap;
import java.util.Map;

/**
 * Evaluates constant OpenQASM expressions (rotation angles, qubit indices, register sizes, loop
 * bounds, {@code if} conditions) to numeric values. Supports numeric literals, the built-in
 * constants pi/tau/euler, bound variables (loop counters, {@code const} declarations and classical
 * declarations with a constant initializer), bit access on bound integers, casts, arithmetic,
 * comparison and logical operators. Booleans are represented as 1.0 (true) and 0.0 (false).
 * Anything depending on runtime values is rejected with a {@link QasmParseException}.
 */
class QasmExpressionEvaluator {

    private final Map<String, Double> variables = new HashMap<>();

    /** Declared bit width per variable, where known, so bit access can be range-checked. */
    private final Map<String, Integer> bitWidths = new HashMap<>();

    /**
     * Binds a variable, returning the previous value (or null if unbound) so callers can restore
     * it via {@link #restore} — loop variables may shadow an outer binding of the same name.
     */
    Double bind(String name, double value) {
        return variables.put(name, value);
    }

    /** Binds a classical variable whose declared bit width is known (e.g. {@code uint[4] a = 1;}). */
    void bindWithWidth(String name, double value, Integer bitWidth) {
        variables.put(name, value);
        if (bitWidth == null) {
            bitWidths.remove(name);
        } else {
            bitWidths.put(name, bitWidth);
        }
    }

    void restore(String name, Double previousValue) {
        if (previousValue == null) {
            variables.remove(name);
        } else {
            variables.put(name, previousValue);
        }
    }

    /**
     * Drops a binding, e.g. because the variable was declared without a constant initializer or
     * was assigned to. Using it in a constant context afterwards is then a clean parse error
     * instead of silently computing with a stale value.
     */
    void unbind(String name) {
        variables.remove(name);
        bitWidths.remove(name);
    }

    double evaluate(OpenQASM3Parser.ExpressionContext expr) {
        return switch (expr) {
            case OpenQASM3Parser.ParenthesisExpressionContext p -> evaluate(p.expression());
            case OpenQASM3Parser.UnaryExpressionContext u -> evaluateUnary(u);
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
            case OpenQASM3Parser.ComparisonExpressionContext c -> evaluateComparison(c);
            case OpenQASM3Parser.EqualityExpressionContext e -> evaluateEquality(e);
            case OpenQASM3Parser.LogicalAndExpressionContext a -> toDouble(
                isTrue(a.expression().getFirst()) && isTrue(a.expression().getLast())
            );
            case OpenQASM3Parser.LogicalOrExpressionContext o -> toDouble(
                isTrue(o.expression().getFirst()) || isTrue(o.expression().getLast())
            );
            case OpenQASM3Parser.CastExpressionContext c -> evaluateCast(c);
            case OpenQASM3Parser.IndexExpressionContext i -> evaluateBitAccess(i);
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

    private double evaluateUnary(OpenQASM3Parser.UnaryExpressionContext u) {
        return switch (u.op.getType()) {
            case OpenQASM3Parser.MINUS -> -evaluate(u.expression());
            case OpenQASM3Parser.EXCLAMATION_POINT -> toDouble(!isTrue(u.expression()));
            default -> throw new QasmParseException(
                "Unsupported operator '%s' in constant expression '%s'.".formatted(u.op.getText(), u.getText())
            );
        };
    }

    private double evaluateComparison(OpenQASM3Parser.ComparisonExpressionContext c) {
        double left = evaluate(c.expression().getFirst());
        double right = evaluate(c.expression().getLast());
        return switch (c.op.getText()) {
            case "<" -> toDouble(left < right);
            case ">" -> toDouble(left > right);
            case "<=" -> toDouble(left <= right);
            case ">=" -> toDouble(left >= right);
            default -> throw new QasmParseException("Unsupported comparison operator '%s'.".formatted(c.op.getText()));
        };
    }

    private double evaluateEquality(OpenQASM3Parser.EqualityExpressionContext e) {
        double left = evaluate(e.expression().getFirst());
        double right = evaluate(e.expression().getLast());
        return switch (e.op.getText()) {
            case "==" -> toDouble(left == right);
            case "!=" -> toDouble(left != right);
            default -> throw new QasmParseException("Unsupported equality operator '%s'.".formatted(e.op.getText()));
        };
    }

    /** Supports the numeric casts that can be folded away, e.g. the {@code bool(...)} in an if condition. */
    private double evaluateCast(OpenQASM3Parser.CastExpressionContext c) {
        if (c.scalarType() == null) {
            throw new QasmParseException("Unsupported cast in constant expression '%s'.".formatted(c.getText()));
        }
        double value = evaluate(c.expression());
        OpenQASM3Parser.ScalarTypeContext type = c.scalarType();
        if (type.BOOL() != null) {
            return toDouble(value != 0.0);
        }
        if (type.INT() != null || type.UINT() != null) {
            return (double) (long) value;
        }
        if (type.FLOAT() != null) {
            return value;
        }
        throw new QasmParseException("Unsupported cast to '%s' in constant expression '%s'.".formatted(type.getText(), c.getText()));
    }

    /**
     * Bit access on a bound integer, e.g. the {@code a_in[i]} in {@code if (bool(a_in[i])) x a[i];}.
     * Index 0 is the least significant bit, so {@code uint[4] a = 1} has {@code a[0] == 1}.
     */
    private double evaluateBitAccess(OpenQASM3Parser.IndexExpressionContext ctx) {
        String name = ctx.expression().getText().trim();
        Double value = variables.get(name);
        if (value == null) {
            throw new QasmParseException("Cannot evaluate '%s': '%s' is not a compile-time constant.".formatted(ctx.getText(), name));
        }
        if (value != Math.floor(value) || Double.isInfinite(value) || Double.isNaN(value)) {
            throw new QasmParseException("Bit access '%s' requires an integer value but '%s' is %s.".formatted(ctx.getText(), name, value));
        }

        OpenQASM3Parser.IndexOperatorContext indexOperator = ctx.indexOperator();
        if (indexOperator.setExpression() != null || indexOperator.expression().size() != 1) {
            throw new QasmParseException(
                "Unsupported bit access '%s': only a single constant index is supported.".formatted(ctx.getText())
            );
        }
        long index = evaluateInt(indexOperator.expression().getFirst(), "bit index");
        Integer width = bitWidths.get(name);
        if (index < 0 || (width != null && index >= width)) {
            throw new QasmParseException(
                "Bit index %d is out of range for '%s'%s.".formatted(index, name, width != null ? " of width " + width : "")
            );
        }
        return ((long) (double) value >> index) & 1L;
    }

    private boolean isTrue(OpenQASM3Parser.ExpressionContext expr) {
        return evaluate(expr) != 0.0;
    }

    private double toDouble(boolean value) {
        return value ? 1.0 : 0.0;
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
            case "true" -> 1.0;
            case "false" -> 0.0;
            default -> {
                try {
                    yield Double.parseDouble(trimmed);
                } catch (NumberFormatException ex) {
                    if (trimmed.matches("[A-Za-z_][A-Za-z0-9_]*")) {
                        throw new QasmParseException(
                            "Unknown identifier '%s' in constant expression: only loop variables, const declarations and classical declarations with a constant value can be used.".formatted(
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
