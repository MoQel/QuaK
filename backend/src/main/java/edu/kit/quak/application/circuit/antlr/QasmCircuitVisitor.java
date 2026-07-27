package edu.kit.quak.application.circuit.antlr;

import edu.kit.quak.application.circuit.exceptions.QasmParseException;
import edu.kit.quak.application.circuit.ports.out.QasmIncludeLoader;
import edu.kit.quak.application.circuit.ports.out.QasmSource;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.gate.GateDefinition;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.antlr.v4.runtime.tree.TerminalNode;

public class QasmCircuitVisitor extends OpenQASM3ParserBaseVisitor<Void> {

    /**
     * Upper bound on the total number of loop-body executions (across all loops, including
     * nesting) so a `for int i in [0:1000000]` cannot flood the circuit with operations.
     */
    private static final int MAX_LOOP_ITERATIONS = 1000;

    /** Upper bound on the operations produced by expanding loops and gate calls. */
    private static final int MAX_OPERATIONS = 2000;

    /** Upper bounds on include expansion, guarding against deep or fanned-out include graphs. */
    private static final int MAX_INCLUDE_DEPTH = 8;

    private static final int MAX_INCLUDES = 32;

    /**
     * Includes that are satisfied by the built-in gate library and therefore resolve to nothing.
     * `stdgates.inc` (OpenQASM 3) and `qelib1.inc` (OpenQASM 2) define exactly the elementary gates
     * {@link QuantumOperationLibrary} already provides.
     */
    private static final Set<String> STANDARD_LIBRARIES = Set.of("stdgates.inc", "qelib1.inc");

    /** The built-in include names, listed in error messages so the user sees what needs no file. */
    private static final String STANDARD_LIBRARY_LIST = STANDARD_LIBRARIES.stream().sorted().collect(Collectors.joining("', '"));

    // Transient content-only circuit: it carries no identity (id/projectId/fileId) because only
    // its registers and layers are returned to the client. Registers are created from the qubit
    // declarations found in the code.
    private final QuantumCircuit circuit = QuantumCircuit.builder().registers(new ArrayList<>()).layers(new ArrayList<>()).build();

    private final QasmExpressionEvaluator evaluator = new QasmExpressionEvaluator();

    /** Parsed `gate` declarations by name, turned into a {@link GateDefinition} on first call. */
    private final Map<String, OpenQASM3Parser.GateStatementContext> gateDefinitions = new HashMap<>();

    /** Built definitions, keyed by gate name plus arguments (a parametrized gate differs per call). */
    private final Map<String, GateDefinition> definitionCache = new HashMap<>();

    /** The gate definition whose body is currently being built, or null when emitting into the circuit. */
    private GateDefinition definitionUnderConstruction = null;

    /** Call chain of the gates currently being inlined, used to detect recursion. */
    private final List<String> gateCallStack = new ArrayList<>();

    /**
     * Formal qubit parameters of the gate body currently being inlined, or null at top level.
     * Inside a body only these names are visible, so a formal named `a` shadows a register `a`.
     */
    private Map<String, ElementSelector> qubitBindings = null;

    private int unrolledIterations = 0;

    private int emittedOperations = 0;

    /** Loads the files pulled in by `include` statements, already bound to the requesting user. */
    private final QasmIncludeLoader includeLoader;

    /**
     * The file whose code is currently being visited. Includes resolve relative to it, so an
     * include inside an included file is relative to that file rather than to the root.
     */
    private String currentFileId;

    /** The file the parse started from. Not on {@link #includeStack}, but still part of any cycle. */
    private final String rootFileId;

    /** Files currently being included, innermost last; used to detect circular includes. */
    private final List<QasmSource> includeStack = new ArrayList<>();

    private int includeCount = 0;

    public QasmCircuitVisitor() {
        this(null, QasmIncludeLoader.NONE);
    }

    public QasmCircuitVisitor(String rootFileId, QasmIncludeLoader includeLoader) {
        this.rootFileId = rootFileId;
        this.currentFileId = rootFileId;
        this.includeLoader = includeLoader == null ? QasmIncludeLoader.NONE : includeLoader;
    }

    public QuantumCircuit getCircuit() {
        return circuit;
    }

    /**
     * Pulls an included file into the parse, exactly as if its source stood in place of the include
     * statement. That is what makes a gate defined in `bell.qasm` usable from `main.qasm`.
     *
     * <p>Standard-library includes resolve to nothing because their gates are built in. Everything
     * else is looked up in the project; a target that does not exist is an error rather than a
     * silent no-op, since the gate calls that follow would otherwise fail with a confusing
     * "Unsupported gate" further down.
     */
    @Override
    public Void visitIncludeStatement(OpenQASM3Parser.IncludeStatementContext ctx) {
        String path = unquote(ctx.StringLiteral().getText());
        if (STANDARD_LIBRARIES.contains(path.toLowerCase(Locale.ROOT))) {
            return null;
        }

        if (includeStack.size() >= MAX_INCLUDE_DEPTH) {
            throw new QasmParseException("Includes are nested more than %d levels deep.".formatted(MAX_INCLUDE_DEPTH));
        }
        if (++includeCount > MAX_INCLUDES) {
            throw new QasmParseException("Expanding includes exceeded the limit of %d files.".formatted(MAX_INCLUDES));
        }

        QasmSource source = includeLoader
            .load(currentFileId, path)
            .orElseThrow(() ->
                new QasmParseException(
                    "Could not resolve include '%s': no such file in this project. (Only '%s' are built in.)".formatted(
                        path,
                        STANDARD_LIBRARY_LIST
                    )
                )
            );
        rejectCircularInclude(source, path);

        visitIncludedSource(source);
        return null;
    }

    /** Visits an included file's source with the include context switched to that file. */
    private void visitIncludedSource(QasmSource source) {
        String previousFileId = currentFileId;
        currentFileId = source.fileId();
        includeStack.add(source);
        try {
            visit(QasmService.toParseTree(source.code()));
        } catch (QasmParseException ex) {
            // Without the file name the location in the message ("line 3:5") points at the wrong file.
            throw new QasmParseException("In included file '%s': %s".formatted(source.name(), ex.getMessage()), ex);
        } finally {
            includeStack.removeLast();
            currentFileId = previousFileId;
        }
    }

    private void rejectCircularInclude(QasmSource source, String path) {
        // The root file is not on the stack but closes a cycle just the same (a -> b -> a).
        boolean alreadyOpen =
            source.fileId().equals(rootFileId) || includeStack.stream().anyMatch(open -> open.fileId().equals(source.fileId()));
        if (!alreadyOpen) {
            return;
        }
        List<String> chain = new ArrayList<>(includeStack.stream().map(QasmSource::name).toList());
        chain.add(path);
        throw new QasmParseException("Circular include: %s.".formatted(String.join(" -> ", chain)));
    }

    /** Strips the surrounding quotes from an include's string literal. */
    private String unquote(String stringLiteral) {
        if (stringLiteral.length() >= 2) {
            char first = stringLiteral.charAt(0);
            if ((first == '"' || first == '\'') && stringLiteral.charAt(stringLiteral.length() - 1) == first) {
                return stringLiteral.substring(1, stringLiteral.length() - 1);
            }
        }
        return stringLiteral;
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
            // A user-defined gate stays one operation instead of being expanded, so the editor can
            // draw it as a box. Its contents remain reachable via the definition.
            addOperation(new CompositeQuantumGate(resolveDefinition(gateName, customGate, arguments), false, operands));
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
     * Returns the {@link GateDefinition} for a call, building it on first use.
     *
     * <p>The cache key includes the arguments because a parametrized gate's body depends on them:
     * {@code myrot(pi)} and {@code myrot(pi/2)} are different bodies and therefore different
     * definitions, while repeated identical calls share one — so {@code bell q[0], q[1]} and
     * {@code bell q[2], q[3]} refer to the same definition, as a reader would expect.
     */
    private GateDefinition resolveDefinition(String gateName, OpenQASM3Parser.GateStatementContext definition, List<Double> arguments) {
        String cacheKey = gateName + arguments;
        GateDefinition cached = definitionCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }
        GateDefinition built = buildDefinition(gateName, definition, arguments);
        definitionCache.put(cacheKey, built);
        return built;
    }

    /**
     * Builds a gate definition by visiting its body with the formal qubits bound to the definition's
     * own formal selectors — rather than to a call site's qubits, which is what the previous inlining
     * did. Emitted operations are redirected into the definition's body via
     * {@link #definitionUnderConstruction}, so a nested gate call becomes a nested composite instead
     * of being flattened.
     */
    private GateDefinition buildDefinition(String gateName, OpenQASM3Parser.GateStatementContext definition, List<Double> arguments) {
        if (gateCallStack.contains(gateName)) {
            List<String> chain = new ArrayList<>(gateCallStack);
            chain.add(gateName);
            throw new QasmParseException("Recursive gate definition: %s.".formatted(String.join(" -> ", chain)));
        }

        List<String> formalParameters = definition.params == null ? List.of() : identifiers(definition.params);
        if (formalParameters.size() != arguments.size()) {
            throw new QasmParseException(
                "Gate '%s' expects %d parameter(s) but got %d.".formatted(gateName, formalParameters.size(), arguments.size())
            );
        }

        GateDefinition gate = new GateDefinition(gateName, identifiers(definition.qubits));

        Map<String, ElementSelector> bindings = new HashMap<>();
        List<String> formalQubits = gate.getParameterNames();
        for (int i = 0; i < formalQubits.size(); i++) {
            bindings.put(formalQubits.get(i), gate.selectorFor(i));
        }

        Map<String, Double> previousParameters = new HashMap<>();
        for (int i = 0; i < formalParameters.size(); i++) {
            previousParameters.put(formalParameters.get(i), evaluator.bind(formalParameters.get(i), arguments.get(i)));
        }

        Map<String, ElementSelector> previousQubitBindings = qubitBindings;
        GateDefinition previousDefinition = definitionUnderConstruction;
        qubitBindings = bindings;
        definitionUnderConstruction = gate;
        gateCallStack.add(gateName);
        try {
            visit(definition.scope());
        } finally {
            gateCallStack.removeLast();
            definitionUnderConstruction = previousDefinition;
            qubitBindings = previousQubitBindings;
            previousParameters.forEach(evaluator::restore);
        }
        return gate;
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

    /**
     * Emits an operation into whatever is currently being built: the body of a gate definition while
     * one is under construction, the circuit itself otherwise.
     */
    private void addOperation(QuantumOperation operation) {
        if (++emittedOperations > MAX_OPERATIONS) {
            throw new QasmParseException("Expanding loops and gate calls exceeded the limit of %d operations.".formatted(MAX_OPERATIONS));
        }
        if (definitionUnderConstruction != null) {
            definitionUnderConstruction.addOperation(operation);
        } else {
            circuit.addQuantumOperation(operation, circuit.getLayers().size());
        }
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
            if (operation != QuantumOperationLibrary.COMPOSITE && operation.name().equalsIgnoreCase(gateName)) {
                return true;
            }
        }
        return false;
    }

    private QuantumOperationLibrary resolveGate(String gateName) {
        // COMPOSITE is the marker for user-defined gates, not a callable gate itself, so a literal
        // `composite q[0];` must fail like any other unknown name instead of resolving to it.
        if (!isBuiltInGate(gateName)) {
            throw new QasmParseException("Unsupported gate '" + gateName + "'.");
        }
        return QuantumOperationLibrary.valueOf(gateName.toUpperCase(Locale.ROOT));
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
