package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.List;

public class QasmCircuitVisitor extends OpenQASM3ParserBaseVisitor<Void> {

    /**
     * Upper bound on the total number of loop-body executions (across all loops, including
     * nesting) so a `for int i in [0:1000000]` cannot flood the circuit with operations.
     */
    private static final int MAX_LOOP_ITERATIONS = 1000;

    // Transient content-only circuit: it carries no identity (id/projectId/fileId) because only
    // its registers and layers are returned to the client. Registers are created from the qubit
    // declarations found in the code.
    private final QuantumCircuit circuit = QuantumCircuit.builder().registers(new ArrayList<>()).layers(new ArrayList<>()).build();

    private final QasmExpressionEvaluator evaluator = new QasmExpressionEvaluator();

    private int unrolledIterations = 0;

    public QuantumCircuit getCircuit() {
        return circuit;
    }

    @Override
    public Void visitQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx) {
        String registerName = ctx.Identifier().getText();
        OpenQASM3Parser.DesignatorContext designator = ctx.qubitType().designator();

        // Default to a single qubit when no [x] designator is given.
        int size = designator != null ? toIntExact(evaluator.evaluateInt(designator.expression(), "qubit register size")) : 1;
        if (size < 1) {
            throw new QasmParseException("Qubit register '%s' must have at least one qubit but got %d.".formatted(registerName, size));
        }

        // Create the register, or resize it if a register with that name already exists.
        var existingRegister = circuit.getRegisterByName(registerName);
        if (existingRegister.isPresent()) {
            if (existingRegister.get() instanceof QuantumRegister quantumRegister) {
                quantumRegister.setNumberOfQubits(size);
            }
        } else {
            circuit.addRegister(new QuantumRegister(registerName, size));
        }

        return null;
    }

    @Override
    public Void visitGateCallStatement(OpenQASM3Parser.GateCallStatementContext ctx) {
        // GPHASE and other operand-less / non-identifier gate calls have no editor representation.
        if (ctx.Identifier() == null || ctx.gateOperandList() == null) {
            throw new QasmParseException("Unsupported gate call: " + ctx.getText());
        }
        // Ignoring a modifier would silently change the gate's semantics (e.g. `inv @ s` is S†, not S).
        if (ctx.gateModifier() != null && !ctx.gateModifier().isEmpty()) {
            throw new QasmParseException("Gate modifiers ('ctrl @', 'negctrl @', 'inv @', 'pow @') are not supported yet.");
        }

        String gateName = ctx.Identifier().getText();
        QuantumOperationLibrary operationType = resolveGate(gateName);

        List<ElementSelector> operands = new ArrayList<>();
        for (OpenQASM3Parser.GateOperandContext operand : ctx.gateOperandList().gateOperand()) {
            operands.add(parseOperand(operand));
        }

        // Split operands into controls and targets via the gate definition (QASM lists controls first).
        int controlCount = operationType.getDefinition().getControlQubits();
        int targetCount = operationType.getDefinition().getTargetQubits();
        if (operands.size() != controlCount + targetCount) {
            throw new QasmParseException(
                "Gate '%s' expects %d qubit(s) but got %d.".formatted(gateName, controlCount + targetCount, operands.size())
            );
        }
        List<ElementSelector> controlQubits = new ArrayList<>(operands.subList(0, controlCount));
        List<ElementSelector> targetQubits = new ArrayList<>(operands.subList(controlCount, operands.size()));

        // Rotation angle from the gate parameters, e.g. the "pi/2" in "rx(pi/2) q[0]".
        double rotationAngle = 0.0;
        if (ctx.expressionList() != null && !ctx.expressionList().expression().isEmpty()) {
            rotationAngle = evaluator.evaluate(ctx.expressionList().expression().getFirst());
        }

        QuantumOperation operation = new ElementaryQuantumGate(operationType, false, targetQubits, controlQubits, rotationAngle);
        circuit.addQuantumOperation(operation, circuit.getLayers().size());
        return null;
    }

    /**
     * Unrolls a for loop over a constant range or set by visiting the body once per iteration
     * value, with the loop variable bound in the expression evaluator. Loops whose iteration
     * values are not compile-time constants (arrays, aliases) cannot be represented as a static
     * circuit and are rejected.
     */
    @Override
    public Void visitForStatement(OpenQASM3Parser.ForStatementContext ctx) {
        String loopVariable = ctx.Identifier().getText();
        List<Double> values = resolveLoopValues(ctx);
        if (values.isEmpty()) {
            return null;
        }

        Double previousBinding = evaluator.bind(loopVariable, values.getFirst());
        try {
            for (double value : values) {
                if (++unrolledIterations > MAX_LOOP_ITERATIONS) {
                    throw loopBudgetExceeded();
                }
                evaluator.bind(loopVariable, value);
                visit(ctx.body);
            }
        } finally {
            evaluator.restore(loopVariable, previousBinding);
        }
        return null;
    }

    /** Binds a `const` declaration so it can be used in loop bounds, indices, and angles. */
    @Override
    public Void visitConstDeclarationStatement(OpenQASM3Parser.ConstDeclarationStatementContext ctx) {
        String name = ctx.Identifier().getText();
        OpenQASM3Parser.ExpressionContext expression = ctx.declarationExpression().expression();
        if (expression == null) {
            throw new QasmParseException(
                "Unsupported const declaration '%s': only numeric constants are supported.".formatted(ctx.getText())
            );
        }
        evaluator.bind(name, evaluator.evaluate(expression));
        return null;
    }

    // Runtime control flow has no static circuit representation. Rejecting it explicitly beats
    // the default visitor behavior, which would silently descend into the body and add its gates
    // unconditionally (e.g. an `if` body would always be applied).

    @Override
    public Void visitWhileStatement(OpenQASM3Parser.WhileStatementContext ctx) {
        throw new QasmParseException("'while' loops depend on runtime values and cannot be represented as a static circuit.");
    }

    @Override
    public Void visitIfStatement(OpenQASM3Parser.IfStatementContext ctx) {
        throw new QasmParseException("'if' statements are not supported yet.");
    }

    @Override
    public Void visitSwitchStatement(OpenQASM3Parser.SwitchStatementContext ctx) {
        throw new QasmParseException("'switch' statements are not supported yet.");
    }

    @Override
    public Void visitBreakStatement(OpenQASM3Parser.BreakStatementContext ctx) {
        throw new QasmParseException("'break' is not supported: loops must have a constant iteration count.");
    }

    @Override
    public Void visitContinueStatement(OpenQASM3Parser.ContinueStatementContext ctx) {
        throw new QasmParseException("'continue' is not supported: loops must have a constant iteration count.");
    }

    @Override
    public Void visitDefStatement(OpenQASM3Parser.DefStatementContext ctx) {
        throw new QasmParseException("Subroutine definitions ('def') are not supported yet.");
    }

    @Override
    public Void visitGateStatement(OpenQASM3Parser.GateStatementContext ctx) {
        throw new QasmParseException("Custom gate definitions ('gate') are not supported yet.");
    }

    /** Resolves the iteration values of a for loop: a constant range `[start:(step:)?stop]` or a set `{a, b, c}`. */
    private List<Double> resolveLoopValues(OpenQASM3Parser.ForStatementContext ctx) {
        if (ctx.setExpression() != null) {
            List<Double> values = new ArrayList<>();
            for (OpenQASM3Parser.ExpressionContext expression : ctx.setExpression().expression()) {
                values.add(evaluator.evaluate(expression));
            }
            return values;
        }
        if (ctx.rangeExpression() != null) {
            return resolveRangeValues(ctx.rangeExpression());
        }
        // Third grammar alternative: iteration over an array or register alias (runtime values).
        throw new QasmParseException(
            "Unsupported for-loop source '%s': only constant ranges like [0:3] or sets like {0, 2, 4} can be unrolled.".formatted(
                ctx.expression().getText()
            )
        );
    }

    private List<Double> resolveRangeValues(OpenQASM3Parser.RangeExpressionContext range) {
        // The range grammar rule is shared with register slicing, where open ends like [0:] are
        // legal — in for loops both endpoints are mandatory, so validate the shape by counts.
        List<OpenQASM3Parser.ExpressionContext> expressions = range.expression();
        int colons = range.COLON().size();

        long start;
        long step;
        long stop;
        if (colons == 1 && expressions.size() == 2) {
            start = evaluator.evaluateInt(expressions.get(0), "loop range start");
            step = 1;
            stop = evaluator.evaluateInt(expressions.get(1), "loop range stop");
        } else if (colons == 2 && expressions.size() == 3) {
            start = evaluator.evaluateInt(expressions.get(0), "loop range start");
            step = evaluator.evaluateInt(expressions.get(1), "loop range step");
            stop = evaluator.evaluateInt(expressions.get(2), "loop range stop");
        } else {
            throw new QasmParseException(
                "For-loop range '[%s]' must specify both start and stop, e.g. [0:3] or [0:2:8].".formatted(range.getText())
            );
        }

        if (step == 0) {
            throw new QasmParseException("For-loop range '[%s]' has step 0 and would never terminate.".formatted(range.getText()));
        }

        // The stop value is inclusive in OpenQASM 3; a range whose step points away from stop is empty.
        long count = 0;
        if ((step > 0 && start <= stop) || (step < 0 && start >= stop)) {
            count = (stop - start) / step + 1;
        }
        if (count > MAX_LOOP_ITERATIONS) {
            throw loopBudgetExceeded();
        }

        List<Double> values = new ArrayList<>();
        for (long i = 0; i < count; i++) {
            values.add((double) (start + i * step));
        }
        return values;
    }

    private QasmParseException loopBudgetExceeded() {
        return new QasmParseException("Loop unrolling exceeded the limit of %d total iterations.".formatted(MAX_LOOP_ITERATIONS));
    }

    /** Resolves a single gate operand (e.g. {@code q[0]} or {@code q[i + 1]}) into an {@link ElementSelector}. */
    private ElementSelector parseOperand(OpenQASM3Parser.GateOperandContext operand) {
        var indexedIdentifier = operand.indexedIdentifier();
        if (indexedIdentifier == null) {
            // e.g. a hardware qubit like `$0`, which the editor model does not represent.
            throw new QasmParseException("Unsupported gate operand: " + operand.getText());
        }

        String registerName = indexedIdentifier.Identifier().getText();
        String registerId = circuit
            .getRegisterByName(registerName)
            .map(Register::getId)
            .orElseThrow(() -> new QasmParseException("Gate references unknown qubit register '" + registerName + "'."));

        int index = 0;
        List<OpenQASM3Parser.IndexOperatorContext> indices = indexedIdentifier.indexOperator();
        if (indices != null && !indices.isEmpty()) {
            List<OpenQASM3Parser.ExpressionContext> exprs = indices.getFirst().expression();
            if (exprs != null && !exprs.isEmpty()) {
                index = toIntExact(evaluator.evaluateInt(exprs.getFirst(), "qubit index"));
            }
        }
        return new ElementSelector(registerId, index);
    }

    private QuantumOperationLibrary resolveGate(String gateName) {
        try {
            return QuantumOperationLibrary.valueOf(gateName.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new QasmParseException("Unsupported gate '" + gateName + "'.");
        }
    }

    private int toIntExact(long value) {
        try {
            return Math.toIntExact(value);
        } catch (ArithmeticException ex) {
            throw new QasmParseException("Value %d is out of range.".formatted(value));
        }
    }
}
