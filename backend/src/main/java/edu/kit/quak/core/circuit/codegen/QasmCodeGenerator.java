package edu.kit.quak.core.circuit.codegen;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.ConcreteQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.Comparator;
import java.util.List;

public class QasmCodeGenerator {

    public static String toCode(QuantumCircuit quantumCircuit) {
        StringBuilder codeStringBuilder = new StringBuilder();

        List<Register> registers = quantumCircuit.getRegisters();
        for (Register register : registers) {
            if (register instanceof QuantumRegister quantumRegister) {
                codeStringBuilder.append("// Register ").append(quantumRegister.getName()).append("\n");
                codeStringBuilder
                    .append("qubit[")
                    .append(quantumRegister.getNumberOfQubits())
                    .append("] ")
                    .append(quantumRegister.getName())
                    .append(";\n");
            }
            // TODO classical register?
        }

        codeStringBuilder.append("\n");

        List<Layer> layers = quantumCircuit.getLayers();
        for (int layerIdx = 0; layerIdx < layers.size(); layerIdx++) {
            Layer layer = layers.get(layerIdx);
            codeStringBuilder.append("// Layer ").append(layerIdx + 1).append("\n");
            codeStringBuilder.append(toCode(quantumCircuit, layer)).append("\n");
        }

        return codeStringBuilder.toString();
    }

    private static String toCode(QuantumCircuit quantumCircuit, Layer layer) {
        //TODO rotation angle aus Elementary holen falls vorhanden
        StringBuilder codeStringBuilder = new StringBuilder();
        // Emit operations in canonical order (topmost involved qubit first) so that
        // generating code and re-parsing it yields a stable circuit layout.
        List<QuantumOperation> quantumOperations = layer.getQuantumOperations();
        List<QuantumOperation> sortedOperations = quantumOperations
            .stream()
            .sorted(Comparator.comparingInt(QasmCodeGenerator::minInvolvedQubitIndex))
            .toList();
        for (QuantumOperation operation : sortedOperations) {
            codeStringBuilder.append(toCode(quantumCircuit, operation)).append("\n");
        }
        return codeStringBuilder.toString();
    }

    private static int minInvolvedQubitIndex(QuantumOperation quantumOperation) {
        int min = Integer.MAX_VALUE;
        for (ElementSelector selector : quantumOperation.getTargetQubits()) {
            min = Math.min(min, selector.getIndex());
        }
        if (quantumOperation.getControlQubits() != null) {
            for (ElementSelector selector : quantumOperation.getControlQubits()) {
                min = Math.min(min, selector.getIndex());
            }
        }
        return min;
    }

    private static String toCode(QuantumCircuit quantumCircuit, QuantumOperation quantumOperation) {
        StringBuilder codeStringBuilder = new StringBuilder();

        // Prefix
        if (quantumOperation.isInverseForm()) {
            codeStringBuilder.append("inv @ ");
        }

        // Operator
        String operatorCode = operatorToCode(quantumOperation);
        codeStringBuilder.append(operatorCode);

        // Control and Target Qubits
        List<String> qubitStrings = new java.util.ArrayList<>();

        if (quantumOperation.getControlQubits() != null) {
            for (ElementSelector control : quantumOperation.getControlQubits()) {
                qubitStrings.add(toCode(quantumCircuit, control));
            }
        }

        for (ElementSelector target : quantumOperation.getTargetQubits()) {
            qubitStrings.add(toCode(quantumCircuit, target));
        }

        if (!qubitStrings.isEmpty()) {
            codeStringBuilder.append(" ").append(String.join(", ", qubitStrings));
        }

        // Semicolon
        codeStringBuilder.append(";");

        return codeStringBuilder.toString();
    }

    private static String operatorToCode(QuantumOperation quantumOperation) {
        QuantumOperationLibrary operationDefinition = quantumOperation.getOperationDefinition();
        String operatorCode = toCode(operationDefinition);
        if (quantumOperation instanceof ElementaryQuantumGate elementaryQuantumGate) {
            if (operationDefinition.getDefinition() instanceof ConcreteQuantumOperation<?> definition && definition.isHasRotationAngle()) {
                return operatorCode + "(" + formatAngle(elementaryQuantumGate.getRotationAngle()) + ")";
            }
            return operatorCode;
        }

        // TODO CompositeOperations
        // TODO Meassurement

        return operatorCode;
    }

    /** Named constants the QASM parser understands, with a small tolerance for round-trip matching. */
    private static final double CONSTANT_MATCH_EPSILON = 1e-9;

    /**
     * Formatiert den Winkel für QASM. Die benannten Konstanten tau und euler sowie rationale Vielfache
     * von pi werden symbolisch ausgegeben (z.B. "tau", "euler", "pi/2", "-pi/4", "2*pi/3"), ansonsten als
     * Dezimalzahl. So überleben sie einen parse → toCode → parse Round-Trip.
     */
    private static String formatAngle(double angle) {
        if (!Double.isFinite(angle)) {
            // Guard against emitting non-QASM tokens like "Infinity"/"NaN"; fall back to a neutral angle.
            return "0";
        }
        if (angle == 0.0) {
            return "0";
        }
        // Check tau before the pi logic so that 2*pi is emitted as "tau" rather than "2*pi".
        String namedConstant = tryFormatAsNamedConstant(angle);
        if (namedConstant != null) {
            return namedConstant;
        }
        String piTerm = tryFormatAsPiMultiple(angle);
        if (piTerm != null) {
            return piTerm;
        }
        if (angle == Math.rint(angle)) {
            return Long.toString((long) angle);
        }
        return Double.toString(angle);
    }

    /** Emits "tau"/"euler" (and their negatives) for the matching constant values, otherwise {@code null}. */
    private static String tryFormatAsNamedConstant(double angle) {
        if (Math.abs(angle - Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "tau";
        }
        if (Math.abs(angle + Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "-tau";
        }
        if (Math.abs(angle - Math.E) < CONSTANT_MATCH_EPSILON) {
            return "euler";
        }
        if (Math.abs(angle + Math.E) < CONSTANT_MATCH_EPSILON) {
            return "-euler";
        }
        return null;
    }

    /**
     * Versucht, den Winkel als rationales Vielfaches von pi darzustellen (Nenner bis 12).
     * Liefert {@code null}, wenn keine passende Darstellung gefunden wird.
     */
    private static String tryFormatAsPiMultiple(double angle) {
        final double epsilon = 1e-9;
        double ratio = angle / Math.PI;
        for (int denominator = 1; denominator <= 12; denominator++) {
            double scaled = ratio * denominator;
            long numerator = Math.round(scaled);
            if (numerator != 0 && Math.abs(scaled - numerator) < epsilon) {
                long gcd = gcd(Math.abs(numerator), denominator);
                return buildPiTerm(numerator / gcd, denominator / gcd);
            }
        }
        return null;
    }

    private static String buildPiTerm(long numerator, long denominator) {
        StringBuilder sb = new StringBuilder();
        if (numerator < 0) {
            sb.append("-");
            numerator = -numerator;
        }
        sb.append(numerator == 1 ? "pi" : numerator + "*pi");
        if (denominator != 1) {
            sb.append("/").append(denominator);
        }
        return sb.toString();
    }

    private static long gcd(long a, long b) {
        while (b != 0) {
            long temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    private static String toCode(QuantumOperationLibrary quantumOperation) {
        return switch (quantumOperation) {
            case H -> "h";
            case X -> "x";
            case Y -> "y";
            case Z -> "z";
            case CX -> "cx";
            case CZ -> "cz";
            case SWAP -> "swap";
            case CCX -> "ccx";
            case S -> "s";
            case T -> "t";
            case RX -> "rx";
            case RY -> "ry";
            case RZ -> "rz";
            case MEASURE -> "measure";
        };
    }

    private static String toCode(QuantumCircuit quantumCircuit, ElementSelector elementSelector) {
        String name = quantumCircuit.getQuantumRegisterNameById(elementSelector.getRegisterId());
        return name + "[" + elementSelector.getIndex() + "]";
    }
}
