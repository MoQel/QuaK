package edu.kit.quak.core.circuit.codegen;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.Layer;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.ConcreteQuantumOperation;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import edu.kit.quak.core.circuit.model.register.Register;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class QiskitCodeGenerator {

    public static String toCode(QuantumCircuit quantumCircuit) {
        StringBuilder codeStringBuilder = new StringBuilder();

        // Qiskit Python Header
        codeStringBuilder.append("from qiskit import QuantumCircuit, QuantumRegister\n");
        codeStringBuilder.append("import math\n\n");

        List<String> registerNames = new ArrayList<>();
        List<Register> registers = quantumCircuit.getRegisters();

        for (Register register : registers) {
            if (register instanceof QuantumRegister quantumRegister) {
                String regName = quantumRegister.getName();
                codeStringBuilder.append("# Register ").append(regName).append("\n");
                codeStringBuilder
                    .append(regName)
                    .append(" = QuantumRegister(")
                    .append(quantumRegister.getNumberOfQubits())
                    .append(", '")
                    .append(regName)
                    .append("')\n");
                registerNames.add(regName);
            }
            // TODO classical register?
        }

        codeStringBuilder.append("\n");

        // QuantumCircuit Initialisierung
        codeStringBuilder.append("qc = QuantumCircuit(").append(String.join(", ", registerNames)).append(")\n\n");

        List<Layer> layers = quantumCircuit.getLayers();
        for (int layerIdx = 0; layerIdx < layers.size(); layerIdx++) {
            Layer layer = layers.get(layerIdx);
            codeStringBuilder.append("# Layer ").append(layerIdx + 1).append("\n");
            codeStringBuilder.append(toCode(quantumCircuit, layer)).append("\n");
        }

        return codeStringBuilder.toString();
    }

    private static String toCode(QuantumCircuit quantumCircuit, Layer layer) {
        StringBuilder codeStringBuilder = new StringBuilder();
        // Emit operations in canonical order (topmost involved qubit first)
        List<QuantumOperation> quantumOperations = layer.getQuantumOperations();
        List<QuantumOperation> sortedOperations = quantumOperations
            .stream()
            .sorted(Comparator.comparingInt(QiskitCodeGenerator::minInvolvedQubitIndex))
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
        codeStringBuilder.append("qc.");

        // Operator Name (inkl. Handling für sdg/tdg)
        String operatorCode = getOperatorMethodName(quantumOperation);
        codeStringBuilder.append(operatorCode).append("(");

        List<String> args = new ArrayList<>();

        // 1. Parameter / Winkel (In Qiskit kommen Winkel immer vor den Qubits)
        if (quantumOperation instanceof ElementaryQuantumGate elementaryQuantumGate) {
            QuantumOperationLibrary operationDefinition = elementaryQuantumGate.getOperationDefinition();
            if (operationDefinition.getDefinition() instanceof ConcreteQuantumOperation<?> definition && definition.isHasRotationAngle()) {
                double angle = elementaryQuantumGate.getRotationAngle();
                // Wenn es invers ist, können wir bei Rotationsgattern einfach den Winkel negieren
                if (quantumOperation.isInverseForm()) {
                    angle = -angle;
                }
                args.add(formatAngle(angle));
            }
        }

        // 2. Control Qubits
        if (quantumOperation.getControlQubits() != null) {
            for (ElementSelector control : quantumOperation.getControlQubits()) {
                args.add(toCode(quantumCircuit, control));
            }
        }

        // 3. Target Qubits
        for (ElementSelector target : quantumOperation.getTargetQubits()) {
            args.add(toCode(quantumCircuit, target));
        }

        codeStringBuilder.append(String.join(", ", args)).append(")");

        return codeStringBuilder.toString();
    }

    private static String getOperatorMethodName(QuantumOperation quantumOperation) {
        // operationDefinition sitzt seit der Composite-Einfuehrung pro Subklasse: nur Operationen mit
        // Library-Definition haben eine. Ein Subcircuit hat keine und wird hier nicht abgebildet.
        QuantumOperationLibrary operationDefinition;
        if (quantumOperation instanceof ElementaryQuantumGate elementaryQuantumGate) {
            operationDefinition = elementaryQuantumGate.getOperationDefinition();
        } else if (quantumOperation instanceof Measurement measurement) {
            operationDefinition = measurement.getOperationDefinition();
        } else {
            return "";
        }
        String operatorCode = toCode(operationDefinition);

        // Qiskit-spezifisches Invers-Handling
        if (quantumOperation.isInverseForm()) {
            switch (operatorCode) {
                case "s":
                    return "sdg";
                case "t":
                    return "tdg";
                // R-Rotations werden durch negativen Winkel invertiert, siehe toCode()
                // H, X, Y, Z, CX, CZ, CCX, SWAP sind selbstinvers, also keine Änderung
            }
        }

        return operatorCode;
    }

    /** Named constants the QASM parser understands, with a small tolerance for round-trip matching. */
    private static final double CONSTANT_MATCH_EPSILON = 1e-9;

    /**
     * Formatiert den Winkel für Qiskit Python. Benutzt math.pi, math.tau, math.e
     * statt der reinen Konstanten wie in QASM.
     */
    private static String formatAngle(double angle) {
        if (!Double.isFinite(angle)) {
            return "0";
        }
        if (angle == 0.0) {
            return "0";
        }
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

    private static String tryFormatAsNamedConstant(double angle) {
        if (Math.abs(angle - Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "math.tau";
        }
        if (Math.abs(angle + Math.TAU) < CONSTANT_MATCH_EPSILON) {
            return "-math.tau";
        }
        if (Math.abs(angle - Math.E) < CONSTANT_MATCH_EPSILON) {
            return "math.e";
        }
        if (Math.abs(angle + Math.E) < CONSTANT_MATCH_EPSILON) {
            return "-math.e";
        }
        return null;
    }

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
        sb.append(numerator == 1 ? "math.pi" : numerator + "*math.pi");
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
            // User-defined gates have no Qiskit equivalent here; expand them before generating.
            case COMPOSITE -> throw new IllegalStateException("Composite gates are not supported by the Qiskit generator yet.");
        };
    }

    private static String toCode(QuantumCircuit quantumCircuit, ElementSelector elementSelector) {
        String name = quantumCircuit.getQuantumRegisterNameById(elementSelector.getRegisterId());
        // Passt perfekt zur Python Listen-Indizierung, z.B. q[0]
        return name + "[" + elementSelector.getIndex() + "]";
    }
}
