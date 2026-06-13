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
import java.util.UUID;

public class QasmCircuitVisitor extends OpenQASM3ParserBaseVisitor<Void> {

    // Start without any registers; they are created from the qubit declarations found in the code.
    private final QuantumCircuit circuit = QuantumCircuit.builder()
        .id(UUID.randomUUID().toString())
        .projectId("test-1")
        .registers(new ArrayList<>())
        .layers(new ArrayList<>())
        .build();

    public QuantumCircuit getCircuit() {
        return circuit;
    }

    @Override
    public Void visitQuantumDeclarationStatement(OpenQASM3Parser.QuantumDeclarationStatementContext ctx) {
        String registerName = ctx.Identifier().getText();
        OpenQASM3Parser.DesignatorContext designator = ctx.qubitType().designator();

        // Default to a single qubit when no [x] designator is given.
        int size = designator != null ? parseConstantInt(designator.expression().getText(), "qubit register size") : 1;

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
            rotationAngle = evaluateAngle(ctx.expressionList().expression().getFirst());
        }

        QuantumOperation operation = new ElementaryQuantumGate(operationType, false, targetQubits, controlQubits, rotationAngle);
        circuit.addQuantumOperation(operation, circuit.getLayers().size());
        return null;
    }

    /** Resolves a single gate operand (e.g. {@code q[0]}) into an {@link ElementSelector}. */
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
                index = parseConstantInt(exprs.getFirst().getText(), "qubit index");
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

    private int parseConstantInt(String text, String context) {
        try {
            return Integer.parseInt(text.trim());
        } catch (NumberFormatException ex) {
            // Variable / expression indices and sizes are not supported yet (see the ripple-carry adder example).
            throw new QasmParseException("Expected a constant integer for %s but got '%s'.".formatted(context, text));
        }
    }

    /**
     * Evaluates a gate parameter (e.g. the angle of an rx/ry/rz) as a floating-point value in radians.
     * Supports constants (pi, tau, euler), numeric literals, and simple arithmetic (+, -, *, /, %, **).
     */
    private double evaluateAngle(OpenQASM3Parser.ExpressionContext expr) {
        return switch (expr) {
            case OpenQASM3Parser.ParenthesisExpressionContext p -> evaluateAngle(p.expression());
            case OpenQASM3Parser.UnaryExpressionContext u -> {
                double value = evaluateAngle(u.expression());
                yield u.op.getType() == OpenQASM3Parser.MINUS ? -value : value;
            }
            case OpenQASM3Parser.PowerExpressionContext pw -> Math.pow(
                evaluateAngle(pw.expression().getFirst()),
                evaluateAngle(pw.expression().getLast())
            );
            case OpenQASM3Parser.MultiplicativeExpressionContext m -> {
                double left = evaluateAngle(m.expression().getFirst());
                double right = evaluateAngle(m.expression().getLast());
                yield switch (m.op.getType()) {
                    case OpenQASM3Parser.ASTERISK -> left * right;
                    case OpenQASM3Parser.SLASH -> left / right;
                    case OpenQASM3Parser.PERCENT -> left % right;
                    default -> 0.0;
                };
            }
            case OpenQASM3Parser.AdditiveExpressionContext a -> {
                double left = evaluateAngle(a.expression().getFirst());
                double right = evaluateAngle(a.expression().getLast());
                yield a.op.getType() == OpenQASM3Parser.PLUS ? left + right : left - right;
            }
            default -> parseConstantOrNumber(expr.getText());
        };
    }

    private double parseConstantOrNumber(String text) {
        return switch (text.trim().toLowerCase()) {
            case "pi", "π" -> Math.PI;
            case "tau", "τ" -> Math.TAU;
            case "euler", "e" -> Math.E;
            default -> {
                try {
                    yield Double.parseDouble(text.trim());
                } catch (NumberFormatException ex) {
                    throw new QasmParseException("Could not evaluate angle expression '" + text + "'.");
                }
            }
        };
    }
}
