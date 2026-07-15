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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import org.antlr.v4.runtime.tree.TerminalNode;

public class QasmCircuitVisitor extends OpenQASM3ParserBaseVisitor<Void> {

    /**
     * Upper bound on the total number of loop-body executions (across all loops, including
     * nesting) so a `for int i in [0:1000000]` cannot flood the circuit with operations.
     */
    private static final int MAX_LOOP_ITERATIONS = 1000;

    /** Upper bound on the operations produced by expanding loops and gate calls. */
    private static final int MAX_OPERATIONS = 2000;

    // Transient content-only circuit: it carries no identity (id/projectId/fileId) because only
    // its registers and layers are returned to the client. Registers are created from the qubit
    // declarations found in the code.
    private final QuantumCircuit circuit = QuantumCircuit.builder().registers(new ArrayList<>()).layers(new ArrayList<>()).build();

    private final QasmExpressionEvaluator evaluator = new QasmExpressionEvaluator();

    /** Custom gate definitions, inlined into elementary gates at each call site. */
    private final Map<String, OpenQASM3Parser.GateStatementContext> gateDefinitions = new HashMap<>();

    /** Call chain of the gates currently being inlined, used to detect recursion. */
    private final List<String> gateCallStack = new ArrayList<>();

    /**
     * Formal qubit parameters of the gate body currently being inlined, or null at top level.
     * Inside a body only these names are visible, so a formal named `a` shadows a register `a`.
     */
    private Map<String, ElementSelector> qubitBindings = null;

    private int unrolledIterations = 0;

    private int emittedOperations = 0;

    public QuantumCircuit getCircuit() {
        return circuit;
    }

    @Override
    public Void visitQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx) {
        declareQuantumRegister(ctx.Identifier().getText(), ctx.qubitType().designator());
        return null;
    }

    /**
     * OpenQASM 2 style register declarations (`qreg a[4];`), which the grammar still accepts. Without
     * this handler they parse silently without declaring anything, and the first gate call then fails
     * with a misleading "unknown qubit register". `creg` is ignored for the same reason `bit[n]` is:
     * classical registers have no editor representation yet.
     */
    @Override
    public Void visitOldStyleDeclarationStatement(OpenQASM3Parser.OldStyleDeclarationStatementContext ctx) {
        if (ctx.QREG() != null) {
            declareQuantumRegister(ctx.Identifier().getText(), ctx.designator());
        }
        return null;
    }

    private void declareQuantumRegister(String registerName, OpenQASM3Parser.DesignatorContext designator) {
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

        List<ElementSelector> operands = new ArrayList<>();
        for (OpenQASM3Parser.GateOperandContext operand : ctx.gateOperandList().gateOperand()) {
            operands.add(parseOperand(operand));
        }

        List<Double> arguments = new ArrayList<>();
        if (ctx.expressionList() != null) {
            for (OpenQASM3Parser.ExpressionContext argument : ctx.expressionList().expression()) {
                arguments.add(evaluator.evaluate(argument));
            }
        }

        OpenQASM3Parser.GateStatementContext customGate = gateDefinitions.get(gateName);
        if (customGate != null) {
            inlineCustomGate(gateName, customGate, operands, arguments);
            return null;
        }

        QuantumOperationLibrary operationType = resolveGate(gateName);

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
        double rotationAngle = arguments.isEmpty() ? 0.0 : arguments.getFirst();

        addOperation(new ElementaryQuantumGate(operationType, false, targetQubits, controlQubits, rotationAngle));
        return null;
    }

    /**
     * Records a custom gate definition for inlining at its call sites. The body is deliberately
     * not visited here: it describes a template over formal qubits, not operations on registers.
     */
    @Override
    public Void visitGateStatement(OpenQASM3Parser.GateStatementContext ctx) {
        String gateName = ctx.Identifier().getText();
        if (isBuiltInGate(gateName)) {
            throw new QasmParseException("Gate definition '%s' shadows a built-in gate.".formatted(gateName));
        }
        if (gateDefinitions.put(gateName, ctx) != null) {
            throw new QasmParseException("Gate '%s' is defined more than once.".formatted(gateName));
        }
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

    /**
     * Folds an if statement whose condition is a compile-time constant, e.g.
     * {@code if (bool(a_in[i])) x a[i];} with a constant {@code a_in}. Conditions depending on
     * runtime values (measurement results, mutable variables) have no static circuit form.
     */
    @Override
    public Void visitIfStatement(OpenQASM3Parser.IfStatementContext ctx) {
        double condition;
        try {
            condition = evaluator.evaluate(ctx.expression());
        } catch (QasmParseException ex) {
            throw new QasmParseException(
                "'if' condition '%s' is not a compile-time constant and cannot be represented as a static circuit: %s".formatted(
                    ctx.expression().getText(),
                    ex.getMessage()
                )
            );
        }

        if (condition != 0.0) {
            visit(ctx.if_body);
        } else if (ctx.else_body != null) {
            visit(ctx.else_body);
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
        evaluator.bindWithWidth(name, evaluator.evaluate(expression), bitWidthOf(ctx.scalarType()));
        return null;
    }

    /**
     * Binds classical declarations with a constant initializer (e.g. {@code uint[4] a_in = 1;}) so
     * they can drive constant folding. Everything else (no initializer, measurement results,
     * arrays) stays unbound, which turns a later use into a clear parse error instead of a
     * silently wrong value.
     */
    @Override
    public Void visitClassicalDeclarationStatement(OpenQASM3Parser.ClassicalDeclarationStatementContext ctx) {
        String name = ctx.Identifier().getText();
        OpenQASM3Parser.DeclarationExpressionContext declaration = ctx.declarationExpression();
        if (declaration == null || declaration.expression() == null) {
            evaluator.unbind(name);
            return null;
        }
        try {
            evaluator.bindWithWidth(name, evaluator.evaluate(declaration.expression()), bitWidthOf(ctx.scalarType()));
        } catch (QasmParseException ex) {
            evaluator.unbind(name);
        }
        return null;
    }

    /** An assigned variable is no longer a compile-time constant, so its binding is dropped. */
    @Override
    public Void visitAssignmentStatement(OpenQASM3Parser.AssignmentStatementContext ctx) {
        evaluator.unbind(ctx.indexedIdentifier().Identifier().getText());
        return null;
    }

    // Runtime control flow has no static circuit representation. Rejecting it explicitly beats
    // the default visitor behavior, which would silently descend into the body and add its gates
    // unconditionally.

    @Override
    public Void visitWhileStatement(OpenQASM3Parser.WhileStatementContext ctx) {
        throw new QasmParseException("'while' loops depend on runtime values and cannot be represented as a static circuit.");
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

    /**
     * Inlines a call to a custom gate: the formal qubits are bound to the actual operands, the
     * formal parameters to the evaluated arguments, and the body is then visited like ordinary
     * code. Nested gate calls work through the recursion.
     */
    private void inlineCustomGate(
        String gateName,
        OpenQASM3Parser.GateStatementContext definition,
        List<ElementSelector> operands,
        List<Double> arguments
    ) {
        if (gateCallStack.contains(gateName)) {
            List<String> chain = new ArrayList<>(gateCallStack);
            chain.add(gateName);
            throw new QasmParseException("Recursive gate definition: %s.".formatted(String.join(" -> ", chain)));
        }

        List<String> formalQubits = identifiers(definition.qubits);
        if (formalQubits.size() != operands.size()) {
            throw new QasmParseException(
                "Gate '%s' expects %d qubit(s) but got %d.".formatted(gateName, formalQubits.size(), operands.size())
            );
        }
        List<String> formalParameters = definition.params == null ? List.of() : identifiers(definition.params);
        if (formalParameters.size() != arguments.size()) {
            throw new QasmParseException(
                "Gate '%s' expects %d parameter(s) but got %d.".formatted(gateName, formalParameters.size(), arguments.size())
            );
        }
        if (new HashSet<>(operands).size() != operands.size()) {
            throw new QasmParseException("Gate '%s' was called with the same qubit more than once.".formatted(gateName));
        }

        Map<String, ElementSelector> bindings = new HashMap<>();
        for (int i = 0; i < formalQubits.size(); i++) {
            if (bindings.put(formalQubits.get(i), operands.get(i)) != null) {
                throw new QasmParseException("Gate '%s' declares the qubit '%s' more than once.".formatted(gateName, formalQubits.get(i)));
            }
        }

        Map<String, Double> previousParameters = new HashMap<>();
        for (int i = 0; i < formalParameters.size(); i++) {
            previousParameters.put(formalParameters.get(i), evaluator.bind(formalParameters.get(i), arguments.get(i)));
        }

        Map<String, ElementSelector> previousQubitBindings = qubitBindings;
        qubitBindings = bindings;
        gateCallStack.add(gateName);
        try {
            visit(definition.scope());
        } finally {
            gateCallStack.removeLast();
            qubitBindings = previousQubitBindings;
            previousParameters.forEach(evaluator::restore);
        }
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

    private void addOperation(QuantumOperation operation) {
        if (++emittedOperations > MAX_OPERATIONS) {
            throw new QasmParseException("Expanding loops and gate calls exceeded the limit of %d operations.".formatted(MAX_OPERATIONS));
        }
        circuit.addQuantumOperation(operation, circuit.getLayers().size());
    }

    /** Resolves a single gate operand (e.g. {@code q[0]}, {@code q[i + 1]} or a formal gate qubit). */
    private ElementSelector parseOperand(OpenQASM3Parser.GateOperandContext operand) {
        var indexedIdentifier = operand.indexedIdentifier();
        if (indexedIdentifier == null) {
            // e.g. a hardware qubit like `$0`, which the editor model does not represent.
            throw new QasmParseException("Unsupported gate operand: " + operand.getText());
        }

        String name = indexedIdentifier.Identifier().getText();
        List<OpenQASM3Parser.IndexOperatorContext> indices = indexedIdentifier.indexOperator();

        if (qubitBindings != null) {
            // A gate body may only use its own formal qubits, so they shadow same-named registers.
            ElementSelector bound = qubitBindings.get(name);
            if (bound == null) {
                throw new QasmParseException(
                    "Gate body may only use its formal qubit parameters, but '%s' is not one of them.".formatted(name)
                );
            }
            if (indices != null && !indices.isEmpty()) {
                throw new QasmParseException("Formal gate qubit '%s' cannot be indexed.".formatted(name));
            }
            // A fresh selector per operation: selectors are mutable and must not be shared.
            return new ElementSelector(bound.getRegisterId(), bound.getIndex());
        }

        String registerId = circuit
            .getRegisterByName(name)
            .map(Register::getId)
            .orElseThrow(() -> new QasmParseException("Gate references unknown qubit register '" + name + "'."));

        int index = 0;
        if (indices != null && !indices.isEmpty()) {
            List<OpenQASM3Parser.ExpressionContext> exprs = indices.getFirst().expression();
            if (exprs != null && !exprs.isEmpty()) {
                index = toIntExact(evaluator.evaluateInt(exprs.getFirst(), "qubit index"));
            }
        }
        return new ElementSelector(registerId, index);
    }

    private List<String> identifiers(OpenQASM3Parser.IdentifierListContext list) {
        return list.Identifier().stream().map(TerminalNode::getText).toList();
    }

    private boolean isBuiltInGate(String gateName) {
        for (QuantumOperationLibrary operation : QuantumOperationLibrary.values()) {
            if (operation.name().equalsIgnoreCase(gateName)) {
                return true;
            }
        }
        return false;
    }

    private QuantumOperationLibrary resolveGate(String gateName) {
        try {
            return QuantumOperationLibrary.valueOf(gateName.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new QasmParseException("Unsupported gate '" + gateName + "'.");
        }
    }

    /** Declared bit width of a scalar type (the 4 in `uint[4]`), or null when not a constant designator. */
    private Integer bitWidthOf(OpenQASM3Parser.ScalarTypeContext type) {
        if (type == null || type.designator() == null) {
            return null;
        }
        try {
            return Math.toIntExact(evaluator.evaluateInt(type.designator().expression(), "bit width"));
        } catch (QasmParseException | ArithmeticException ex) {
            return null;
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
